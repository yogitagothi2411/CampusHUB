import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import timedelta

from services.event_services.database import Base
from services.event_services.main import app, get_db
from services.auth.dependencies import get_db as get_auth_db
from services.auth import security, models

# Use an in-memory SQLite database for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_auth_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def register_user(name, email, password, role="student"):
    return client.post("/auth/register", json={
        "name": name, "email": email, "password": password, "role": role,
    })

def login_user(email, password):
    res = client.post("/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

EVENT_PAYLOAD = {
    "name": "Hackathon 2026",
    "category": "Technical",
    "venue": "IIIT Vadodara Campus",
    "description": "Annual flagship coding sprint",
    "capacity": 150,
    "status": "Upcoming",
}

# ===========================================================================
# Existing tests (preserved from Phase 3)
# ===========================================================================
def test_health_and_root():
    res = client.get("/")
    assert res.status_code == 200
    assert "running" in res.json()["message"]

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

def test_register_and_login_flow():
    # 1. Register student
    res = register_user("Student User", "student@college.edu", "Password123", "student")
    assert res.status_code == 201
    assert res.json()["email"] == "student@college.edu"

    # 2. Duplicate registration fails
    dup = register_user("Student User 2", "student@college.edu", "Password123", "student")
    assert dup.status_code == 400

    # 3. Login with wrong password
    bad_login = client.post("/auth/login", data={
        "username": "student@college.edu", "password": "WrongPassword",
    })
    assert bad_login.status_code == 401

    # 4. Login with correct password
    login_res = client.post("/auth/login", data={
        "username": "student@college.edu", "password": "Password123",
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_role_based_event_protection():
    # Register organizer and student
    register_user("Organizer Bob", "organizer@college.edu", "Password123", "organizer")
    register_user("Student Alice", "alice@college.edu", "Password123", "student")

    # Get tokens
    org_token = login_user("organizer@college.edu", "Password123")
    student_token = login_user("alice@college.edu", "Password123")

    # Public event list (unauthenticated) works
    res = client.get("/events")
    assert res.status_code == 200

    # Unauthenticated create fails (401)
    no_auth_res = client.post("/events", json=EVENT_PAYLOAD)
    assert no_auth_res.status_code == 401

    # Student cannot create event (403 Forbidden)
    student_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(student_token),
    )
    assert student_res.status_code == 403

    # Organizer can create event (201 Created)
    org_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(org_token),
    )
    assert org_res.status_code == 201
    created_id = org_res.json()["id"]

    # Organizer can update own event
    update_res = client.patch(
        f"/events/{created_id}",
        json={"capacity": 200},
        headers=auth_header(org_token),
    )
    assert update_res.status_code == 200
    assert update_res.json()["capacity"] == 200

    # Organizer can delete own event
    del_res = client.delete(
        f"/events/{created_id}", headers=auth_header(org_token),
    )
    assert del_res.status_code == 204

# ===========================================================================
# New: Admin registration rejection
# ===========================================================================
def test_admin_role_rejected_at_register():
    """Public registration with role='admin' must be rejected (422 by schema regex)."""
    res = client.post("/auth/register", json={
        "name": "Evil Admin",
        "email": "evil@college.edu",
        "password": "Password123",
        "role": "admin",
    })
    assert res.status_code == 422

def test_unknown_role_rejected_at_register():
    """Arbitrary role values like 'superuser' must be rejected."""
    res = client.post("/auth/register", json={
        "name": "Random User",
        "email": "random@college.edu",
        "password": "Password123",
        "role": "superuser",
    })
    assert res.status_code == 422

# ===========================================================================
# New: Password hashing verification
# ===========================================================================
def test_password_is_hashed_not_plaintext():
    """Verify the stored password is a bcrypt hash, not plaintext."""
    register_user("Hash Test", "hashtest@college.edu", "MySecret123")
    db = TestingSessionLocal()
    try:
        user = db.query(models.User).filter(
            models.User.email == "hashtest@college.edu"
        ).first()
        assert user is not None
        # Must not be stored as plaintext
        assert user.password_hash != "MySecret123"
        # Must be a bcrypt hash
        assert user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$")
        # Must verify correctly
        assert security.verify_password("MySecret123", user.password_hash)
        assert not security.verify_password("WrongPassword", user.password_hash)
    finally:
        db.close()

# ===========================================================================
# New: JWT validation
# ===========================================================================
def test_invalid_jwt_rejected():
    """Garbage JWT token returns 401."""
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401

def test_expired_jwt_rejected():
    """Expired JWT token returns 401."""
    expired_token = security.create_access_token(
        data={"sub": "999", "role": "student"},
        expires_delta=timedelta(seconds=-10),
    )
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401

# ===========================================================================
# New: /auth/me endpoint
# ===========================================================================
def test_auth_me_returns_profile():
    """GET /auth/me returns the authenticated user's profile without leaking password."""
    register_user("Me User", "me@college.edu", "Password123", "student")
    token = login_user("me@college.edu", "Password123")
    res = client.get("/auth/me", headers=auth_header(token))
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "me@college.edu"
    assert data["name"] == "Me User"
    assert data["role"] == "student"
    assert "password_hash" not in data

# ===========================================================================
# New: Admin provisioning
# ===========================================================================
def test_provision_admin_valid_secret():
    """Provision admin with correct secret succeeds."""
    res = client.post("/auth/provision-admin", json={
        "name": "Admin User",
        "email": "admin@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })
    assert res.status_code == 201
    assert res.json()["role"] == "admin"

def test_provision_admin_invalid_secret():
    """Provision admin with wrong secret is rejected."""
    res = client.post("/auth/provision-admin", json={
        "name": "Fake Admin",
        "email": "fake@college.edu",
        "password": "FakePass123",
        "admin_secret": "wrong-secret",
    })
    assert res.status_code == 403

# ===========================================================================
# New: GET single event + 404
# ===========================================================================
def test_get_single_event():
    """GET /events/{id} returns the event."""
    register_user("Org", "org@college.edu", "Password123", "organizer")
    token = login_user("org@college.edu", "Password123")
    create_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(token))
    event_id = create_res.json()["id"]

    res = client.get(f"/events/{event_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Hackathon 2026"

def test_get_missing_event_returns_404():
    """GET /events/{id} for non-existent ID returns 404."""
    res = client.get("/events/9999")
    assert res.status_code == 404

# ===========================================================================
# New: PUT replace
# ===========================================================================
def test_put_replace_event():
    """PUT /events/{id} fully replaces the event."""
    register_user("Org", "org@college.edu", "Password123", "organizer")
    token = login_user("org@college.edu", "Password123")
    create_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(token))
    event_id = create_res.json()["id"]

    replacement = {
        "name": "Replaced Event",
        "category": "Cultural",
        "venue": "New Venue",
    }
    res = client.put(
        f"/events/{event_id}", json=replacement, headers=auth_header(token),
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Replaced Event"
    assert res.json()["category"] == "Cultural"

# ===========================================================================
# New: Student blocked from update/delete
# ===========================================================================
def test_student_cannot_update_or_delete():
    """Students are forbidden from PATCH and DELETE on events."""
    register_user("Org", "org@college.edu", "Password123", "organizer")
    register_user("Stu", "stu@college.edu", "Password123", "student")
    org_token = login_user("org@college.edu", "Password123")
    stu_token = login_user("stu@college.edu", "Password123")

    create_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(org_token),
    )
    event_id = create_res.json()["id"]

    patch_res = client.patch(
        f"/events/{event_id}",
        json={"capacity": 999},
        headers=auth_header(stu_token),
    )
    assert patch_res.status_code == 403

    del_res = client.delete(
        f"/events/{event_id}", headers=auth_header(stu_token),
    )
    assert del_res.status_code == 403

# ===========================================================================
# New: Ownership enforcement
# ===========================================================================
def test_organizer_cannot_modify_other_organizers_event():
    """Organizer A cannot PATCH, PUT, or DELETE events owned by Organizer B."""
    register_user("Org A", "orga@college.edu", "Password123", "organizer")
    register_user("Org B", "orgb@college.edu", "Password123", "organizer")
    token_a = login_user("orga@college.edu", "Password123")
    token_b = login_user("orgb@college.edu", "Password123")

    # A creates an event
    create_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(token_a),
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    # B tries to PATCH → 403
    patch_res = client.patch(
        f"/events/{event_id}",
        json={"capacity": 999},
        headers=auth_header(token_b),
    )
    assert patch_res.status_code == 403

    # B tries to PUT → 403
    put_res = client.put(
        f"/events/{event_id}", json=EVENT_PAYLOAD, headers=auth_header(token_b),
    )
    assert put_res.status_code == 403

    # B tries to DELETE → 403
    del_res = client.delete(
        f"/events/{event_id}", headers=auth_header(token_b),
    )
    assert del_res.status_code == 403

    # A can still modify own event
    patch_a = client.patch(
        f"/events/{event_id}",
        json={"capacity": 300},
        headers=auth_header(token_a),
    )
    assert patch_a.status_code == 200
    assert patch_a.json()["capacity"] == 300

def test_admin_can_modify_any_event():
    """Admin can PATCH and DELETE events owned by any organizer."""
    register_user("Org", "org@college.edu", "Password123", "organizer")
    client.post("/auth/provision-admin", json={
        "name": "Admin",
        "email": "admin@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })
    org_token = login_user("org@college.edu", "Password123")
    admin_token = login_user("admin@college.edu", "AdminPass123")

    # Organizer creates event
    create_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(org_token),
    )
    event_id = create_res.json()["id"]

    # Admin can PATCH
    patch_res = client.patch(
        f"/events/{event_id}",
        json={"capacity": 500},
        headers=auth_header(admin_token),
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["capacity"] == 500

    # Admin can DELETE
    del_res = client.delete(
        f"/events/{event_id}", headers=auth_header(admin_token),
    )
    assert del_res.status_code == 204

def test_event_response_includes_owner_id():
    """Created event response includes owner_id matching the creating user."""
    register_user("Org", "org@college.edu", "Password123", "organizer")
    token = login_user("org@college.edu", "Password123")

    # Get user ID
    me_res = client.get("/auth/me", headers=auth_header(token))
    user_id = me_res.json()["id"]

    create_res = client.post(
        "/events", json=EVENT_PAYLOAD, headers=auth_header(token),
    )
    assert create_res.status_code == 201
    assert create_res.json()["owner_id"] == user_id


def test_cors_preflight_and_origins():
    """Verify CORS middleware allows Vite local origins and credentials."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization,Content-Type",
    }
    response = client.options("/events", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


# ===========================================================================
# Phase 5: Club Management Tests
# ===========================================================================

def test_list_and_get_clubs_public():
    """Public users can list clubs and retrieve details by club_id."""
    from services.clubs.router import seed_iiitv_clubs
    db = TestingSessionLocal()
    try:
        seed_iiitv_clubs(db)
    finally:
        db.close()

    res = client.get("/clubs")
    assert res.status_code == 200
    clubs = res.json()
    assert len(clubs) >= 14
    club_names = [c["name"] for c in clubs]
    assert "Coding Club" in club_names

    # Test single club fetch
    single_res = client.get(f"/clubs/{clubs[0]['id']}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == clubs[0]["id"]

    # Test 404 for non-existent club
    missing = client.get("/clubs/non-existent-club-id")
    assert missing.status_code == 404


def test_admin_club_crud():
    """Admin can create, update, and delete clubs."""
    client.post("/auth/provision-admin", json={
        "name": "Admin User",
        "email": "admin_club@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })
    admin_token = login_user("admin_club@college.edu", "AdminPass123")

    # Create club
    new_club = {
        "name": "Robotics & AI Club",
        "category": "Technical",
        "committee": "Technical",
        "description": "Building autonomous systems and smart robots",
        "lead": "Aarav Sharma",
        "faculty_coordinator": "Dr. Pratik Shah",
        "contact_email": "robotics@iiitvadodara.ac.in",
        "tags": ["Robotics", "AI", "Hardware"],
        "status": "Active"
    }
    create_res = client.post("/clubs", json=new_club, headers=auth_header(admin_token))
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == "Robotics & AI Club"
    club_id = created["id"]

    # Update club
    update_res = client.put(f"/clubs/{club_id}", json={
        "description": "Updated autonomous robotics club",
        "status": "Recruiting"
    }, headers=auth_header(admin_token))
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated autonomous robotics club"
    assert update_res.json()["status"] == "Recruiting"

    # Delete club
    del_res = client.delete(f"/clubs/{club_id}", headers=auth_header(admin_token))
    assert del_res.status_code == 204

    # Verify deleted
    verify = client.get(f"/clubs/{club_id}")
    assert verify.status_code == 404


def test_non_admin_cannot_manage_clubs():
    """Students and organizers are denied club creation/updates/deletions with 403."""
    register_user("Student", "student_club@college.edu", "Password123", "student")
    register_user("Organizer", "org_club@college.edu", "Password123", "organizer")

    stu_token = login_user("student_club@college.edu", "Password123")
    org_token = login_user("org_club@college.edu", "Password123")

    club_payload = {
        "name": "Unauthorized Club",
        "category": "Cultural",
        "description": "Testing permissions"
    }

    # Student cannot create
    res1 = client.post("/clubs", json=club_payload, headers=auth_header(stu_token))
    assert res1.status_code == 403

    # Organizer cannot create
    res2 = client.post("/clubs", json=club_payload, headers=auth_header(org_token))
    assert res2.status_code == 403

    # Anonymous cannot create
    res3 = client.post("/clubs", json=club_payload)
    assert res3.status_code == 401


def test_club_seed_idempotency():
    """Running seed multiple times does not duplicate clubs."""
    from services.clubs.router import seed_iiitv_clubs
    db = TestingSessionLocal()
    try:
        seed_iiitv_clubs(db)
        seed_iiitv_clubs(db)
        seed_iiitv_clubs(db)
    finally:
        db.close()

    res = client.get("/clubs")
    assert res.status_code == 200
    assert len(res.json()) == 14


# ===========================================================================
# Phase 5: Event Registration Tests
# ===========================================================================

def test_student_event_registration_flow():
    """Student can register, inspect status, view my registrations, and cancel."""
    # 1. Setup Organizer & Event
    register_user("Event Org", "eventorg@college.edu", "Password123", "organizer")
    org_token = login_user("eventorg@college.edu", "Password123")
    event_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(org_token))
    event_id = event_res.json()["id"]

    # 2. Setup Student
    register_user("Student Alice", "alice@college.edu", "Password123", "student")
    stu_token = login_user("alice@college.edu", "Password123")

    # 3. Check status before registration
    status_pre = client.get(f"/events/{event_id}/registrations/me", headers=auth_header(stu_token))
    assert status_pre.status_code == 200
    assert status_pre.json()["is_registered"] is False
    assert status_pre.json()["registration"] is None

    # 4. Register Alice
    reg_payload = {
        "student_name": "Alice Patel",
        "student_email": "alice@college.edu",
        "student_roll": "202351001",
        "department": "CSE"
    }
    reg_res = client.post(f"/events/{event_id}/registrations", json=reg_payload, headers=auth_header(stu_token))
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["event_id"] == event_id
    assert data["status"] == "registered"
    assert data["ticket_id"].startswith("CEH-")

    # 5. Check status after registration
    status_post = client.get(f"/events/{event_id}/registrations/me", headers=auth_header(stu_token))
    assert status_post.status_code == 200
    assert status_post.json()["is_registered"] is True
    assert status_post.json()["registration"]["status"] == "registered"
    assert status_post.json()["registration"]["ticket_id"] == data["ticket_id"]

    # 6. Check GET /registrations/me
    my_regs = client.get("/registrations/me", headers=auth_header(stu_token))
    assert my_regs.status_code == 200
    my_list = my_regs.json()
    assert len(my_list) == 1
    assert my_list[0]["event_id"] == event_id
    assert my_list[0]["event_name"] == EVENT_PAYLOAD["name"]

    # 7. Cancel registration
    cancel_res = client.delete(f"/events/{event_id}/registrations/me", headers=auth_header(stu_token))
    assert cancel_res.status_code == 200
    assert "cancelled successfully" in cancel_res.json()["message"].lower()

    # 8. Check status after cancellation
    status_cancelled = client.get(f"/events/{event_id}/registrations/me", headers=auth_header(stu_token))
    assert status_cancelled.status_code == 200
    assert status_cancelled.json()["is_registered"] is False
    assert status_cancelled.json()["registration"] is None

    # 9. Re-register after cancellation
    rereg_res = client.post(f"/events/{event_id}/registrations", json=reg_payload, headers=auth_header(stu_token))
    assert rereg_res.status_code == 201
    assert rereg_res.json()["status"] == "registered"


def test_duplicate_registration_rejection():
    """Duplicate active registration for the same event returns 409 Conflict."""
    register_user("Org", "org_dup@college.edu", "Password123", "organizer")
    org_token = login_user("org_dup@college.edu", "Password123")
    event_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(org_token))
    event_id = event_res.json()["id"]

    register_user("Bob", "bob@college.edu", "Password123", "student")
    bob_token = login_user("bob@college.edu", "Password123")

    reg_payload = {"student_name": "Bob", "student_email": "bob@college.edu"}
    res1 = client.post(f"/events/{event_id}/registrations", json=reg_payload, headers=auth_header(bob_token))
    assert res1.status_code == 201

    # Second registration attempt
    res2 = client.post(f"/events/{event_id}/registrations", json=reg_payload, headers=auth_header(bob_token))
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"].lower()


def test_event_capacity_enforcement():
    """Registrations exceeding event capacity return 409 Conflict."""
    register_user("Org", "org_cap@college.edu", "Password123", "organizer")
    org_token = login_user("org_cap@college.edu", "Password123")
    cap_payload = dict(EVENT_PAYLOAD, capacity=1)
    event_res = client.post("/events", json=cap_payload, headers=auth_header(org_token))
    event_id = event_res.json()["id"]

    register_user("Student 1", "s1@college.edu", "Password123", "student")
    register_user("Student 2", "s2@college.edu", "Password123", "student")
    t1 = login_user("s1@college.edu", "Password123")
    t2 = login_user("s2@college.edu", "Password123")

    # Student 1 registers (fills capacity to 1/1)
    r1 = client.post(f"/events/{event_id}/registrations", json={"student_name": "S1"}, headers=auth_header(t1))
    assert r1.status_code == 201

    # Student 2 tries to register
    r2 = client.post(f"/events/{event_id}/registrations", json={"student_name": "S2"}, headers=auth_header(t2))
    assert r2.status_code == 409
    assert "limit reached" in r2.json()["detail"].lower() or "full" in r2.json()["detail"].lower()


def test_organizer_attendee_list_permissions():
    """Event owner and admin can view attendees; unauthorized users are rejected with 403."""
    register_user("Owner Org", "owner@college.edu", "Password123", "organizer")
    register_user("Other Org", "other@college.edu", "Password123", "organizer")
    register_user("Student Carol", "carol@college.edu", "Password123", "student")
    client.post("/auth/provision-admin", json={
        "name": "Admin",
        "email": "admin_attendees@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })

    owner_token = login_user("owner@college.edu", "Password123")
    other_token = login_user("other@college.edu", "Password123")
    carol_token = login_user("carol@college.edu", "Password123")
    admin_token = login_user("admin_attendees@college.edu", "AdminPass123")

    event_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(owner_token))
    event_id = event_res.json()["id"]

    # Carol registers
    reg = client.post(f"/events/{event_id}/registrations", json={"student_name": "Carol"}, headers=auth_header(carol_token))
    assert reg.status_code == 201

    # 1. Owner can view attendee list
    owner_view = client.get(f"/events/{event_id}/registrations", headers=auth_header(owner_token))
    assert owner_view.status_code == 200
    attendees = owner_view.json()
    assert len(attendees) == 1
    assert attendees[0]["student_name"] == "Carol"

    # 2. Admin can view attendee list
    admin_view = client.get(f"/events/{event_id}/registrations", headers=auth_header(admin_token))
    assert admin_view.status_code == 200
    assert len(admin_view.json()) == 1

    # 3. Unauthorized organizer cannot view attendee list
    other_view = client.get(f"/events/{event_id}/registrations", headers=auth_header(other_token))
    assert other_view.status_code == 403

    # 4. Student cannot view attendee list
    student_view = client.get(f"/events/{event_id}/registrations", headers=auth_header(carol_token))
    assert student_view.status_code == 403


# ===========================================================================
# Phase 6: Notifications, Announcements & Event Reminders Tests
# ===========================================================================

def test_notification_auth_and_ownership():
    """Notifications require auth and users can access only their own notifications."""
    # 1. Anonymous access is denied
    anon = client.get("/notifications/me")
    assert anon.status_code == 401

    anon_count = client.get("/notifications/me/unread-count")
    assert anon_count.status_code == 401

    # 2. Register User A and User B
    register_user("User A", "usera@college.edu", "Password123", "student")
    register_user("User B", "userb@college.edu", "Password123", "student")
    token_a = login_user("usera@college.edu", "Password123")
    token_b = login_user("userb@college.edu", "Password123")

    # 3. Create a notification for User A directly via DB
    from services.notifications.router import create_notification
    db = TestingSessionLocal()
    try:
        user_a = db.query(models.User).filter(models.User.email == "usera@college.edu").first()
        user_b = db.query(models.User).filter(models.User.email == "userb@college.edu").first()
        notif_a = create_notification(
            db=db,
            recipient_user_id=user_a.id,
            title="Welcome User A",
            message="Your account is ready",
            notification_type="general",
        )
        notif_a_id = notif_a.id
    finally:
        db.close()

    # User A sees notification
    res_a = client.get("/notifications/me", headers=auth_header(token_a))
    assert res_a.status_code == 200
    items_a = res_a.json()
    assert len(items_a) == 1
    assert items_a[0]["id"] == notif_a_id
    assert items_a[0]["title"] == "Welcome User A"

    # User B sees no notifications
    res_b = client.get("/notifications/me", headers=auth_header(token_b))
    assert res_b.status_code == 200
    assert len(res_b.json()) == 0

    # User B cannot read User A's notification
    patch_b = client.patch(f"/notifications/{notif_a_id}/read", headers=auth_header(token_b))
    assert patch_b.status_code == 404

    # User B cannot delete User A's notification
    del_b = client.delete(f"/notifications/{notif_a_id}", headers=auth_header(token_b))
    assert del_b.status_code == 404


def test_notification_mark_as_read_and_read_all():
    """Mark as read updates only specific notification; read-all affects only current user."""
    register_user("User C", "userc@college.edu", "Password123", "student")
    register_user("User D", "userd@college.edu", "Password123", "student")
    token_c = login_user("userc@college.edu", "Password123")
    token_d = login_user("userd@college.edu", "Password123")

    from services.notifications.router import create_notification
    db = TestingSessionLocal()
    try:
        user_c = db.query(models.User).filter(models.User.email == "userc@college.edu").first()
        user_d = db.query(models.User).filter(models.User.email == "userd@college.edu").first()
        n1 = create_notification(db, user_c.id, "N1", "Msg 1").id
        n2 = create_notification(db, user_c.id, "N2", "Msg 2").id
        n3 = create_notification(db, user_d.id, "N3", "Msg 3").id
    finally:
        db.close()

    # Check unread counts
    count_c = client.get("/notifications/me/unread-count", headers=auth_header(token_c))
    assert count_c.status_code == 200
    assert count_c.json()["unread_count"] == 2

    # Mark N1 as read for User C
    mark_res = client.patch(f"/notifications/{n1}/read", headers=auth_header(token_c))
    assert mark_res.status_code == 200
    assert mark_res.json()["is_read"] is True

    # Count for C becomes 1
    count_c2 = client.get("/notifications/me/unread-count", headers=auth_header(token_c))
    assert count_c2.json()["unread_count"] == 1

    # Read-all for User C
    read_all = client.post("/notifications/me/read-all", headers=auth_header(token_c))
    assert read_all.status_code == 200
    assert read_all.json()["updated_count"] == 1

    # Count for C becomes 0
    count_c3 = client.get("/notifications/me/unread-count", headers=auth_header(token_c))
    assert count_c3.json()["unread_count"] == 0

    # User D's notification remains unread
    count_d = client.get("/notifications/me/unread-count", headers=auth_header(token_d))
    assert count_d.json()["unread_count"] == 1


def test_announcements_crud_and_permissions():
    """Admin can create, update, and delete announcements; students cannot mutate."""
    client.post("/auth/provision-admin", json={
        "name": "Admin Announcer",
        "email": "admin_ann@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })
    register_user("Student Dave", "dave@college.edu", "Password123", "student")

    admin_token = login_user("admin_ann@college.edu", "AdminPass123")
    student_token = login_user("dave@college.edu", "Password123")

    # 1. Student cannot create announcement
    deny_create = client.post("/announcements", json={
        "title": "Unauthorized", "body": "Spam", "category": "General"
    }, headers=auth_header(student_token))
    assert deny_create.status_code == 403

    # 2. Admin creates published announcement
    ann_payload = {
        "title": "Kreiva 2026 Registrations Open",
        "body": "Auditions for campus music and drama clubs are now live.",
        "category": "Cultural",
        "is_published": True
    }
    create_res = client.post("/announcements", json=ann_payload, headers=auth_header(admin_token))
    assert create_res.status_code == 201
    ann_data = create_res.json()
    assert ann_data["title"] == ann_payload["title"]
    ann_id = ann_data["id"]

    # 3. Public/Student can view published announcement
    list_res = client.get("/announcements", headers=auth_header(student_token))
    assert list_res.status_code == 200
    assert any(a["id"] == ann_id for a in list_res.json())

    single_res = client.get(f"/announcements/{ann_id}")
    assert single_res.status_code == 200
    assert single_res.json()["title"] == ann_payload["title"]

    # 4. Admin updates announcement
    update_res = client.put(f"/announcements/{ann_id}", json={
        "title": "Kreiva 2026 - Auditions Extended",
    }, headers=auth_header(admin_token))
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Kreiva 2026 - Auditions Extended"

    # 5. Student cannot update announcement
    deny_update = client.put(f"/announcements/{ann_id}", json={"title": "Hacked"}, headers=auth_header(student_token))
    assert deny_update.status_code == 403

    # 6. Admin deletes announcement
    del_res = client.delete(f"/announcements/{ann_id}", headers=auth_header(admin_token))
    assert del_res.status_code == 204

    # Verify deleted
    get_del = client.get(f"/announcements/{ann_id}")
    assert get_del.status_code == 404


def test_unpublished_announcement_hidden_from_public():
    """Unpublished announcements are hidden from non-admin users."""
    client.post("/auth/provision-admin", json={
        "name": "Admin Draft",
        "email": "admin_draft@college.edu",
        "password": "AdminPass123",
        "admin_secret": "iiitv-admin-secret-2024",
    })
    register_user("Student Eve", "eve@college.edu", "Password123", "student")

    admin_token = login_user("admin_draft@college.edu", "AdminPass123")
    eve_token = login_user("eve@college.edu", "Password123")

    # Create unpublished announcement
    create_res = client.post("/announcements", json={
        "title": "Secret Draft",
        "body": "Not for public eyes yet",
        "category": "Confidential",
        "is_published": False,
    }, headers=auth_header(admin_token))
    assert create_res.status_code == 201
    draft_id = create_res.json()["id"]

    # Student cannot see it in list
    eve_list = client.get("/announcements", headers=auth_header(eve_token))
    assert all(a["id"] != draft_id for a in eve_list.json())

    # Student cannot get it by ID
    eve_single = client.get(f"/announcements/{draft_id}", headers=auth_header(eve_token))
    assert eve_single.status_code == 404

    # Admin can get it by ID
    admin_single = client.get(f"/announcements/{draft_id}", headers=auth_header(admin_token))
    assert admin_single.status_code == 200
    assert admin_single.json()["is_published"] is False


def test_registration_creates_in_app_notification():
    """Event registration creates a persistent in-app notification for the student."""
    register_user("Org", "org_notif@college.edu", "Password123", "organizer")
    org_token = login_user("org_notif@college.edu", "Password123")
    event_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(org_token))
    event_id = event_res.json()["id"]

    register_user("Student Frank", "frank@college.edu", "Password123", "student")
    frank_token = login_user("frank@college.edu", "Password123")

    # Register Frank
    reg_res = client.post(f"/events/{event_id}/registrations", json={"student_name": "Frank"}, headers=auth_header(frank_token))
    assert reg_res.status_code == 201

    # Check Frank's notifications
    notifs = client.get("/notifications/me", headers=auth_header(frank_token))
    assert notifs.status_code == 200
    items = notifs.json()
    assert len(items) >= 1
    reg_notif = next((n for n in items if n["event_id"] == event_id), None)
    assert reg_notif is not None
    assert reg_notif["notification_type"] == "registration"
    assert EVENT_PAYLOAD["name"] in reg_notif["title"]


def test_event_update_and_cancellation_notifies_attendees():
    """Modifying event venue/date or deleting/cancelling notifies all registered students."""
    register_user("Org", "org_changes@college.edu", "Password123", "organizer")
    org_token = login_user("org_changes@college.edu", "Password123")
    event_res = client.post("/events", json=EVENT_PAYLOAD, headers=auth_header(org_token))
    event_id = event_res.json()["id"]

    register_user("Student Grace", "grace@college.edu", "Password123", "student")
    grace_token = login_user("grace@college.edu", "Password123")

    # Grace registers
    client.post(f"/events/{event_id}/registrations", json={"student_name": "Grace"}, headers=auth_header(grace_token))

    # Organizer updates venue
    patch_res = client.patch(f"/events/{event_id}", json={"venue": "Auditorium Hall B"}, headers=auth_header(org_token))
    assert patch_res.status_code == 200

    # Grace should receive event_update notification
    notifs = client.get("/notifications/me", headers=auth_header(grace_token))
    assert notifs.status_code == 200
    update_notif = next((n for n in notifs.json() if n["notification_type"] == "event_update"), None)
    assert update_notif is not None
    assert "Auditorium Hall B" in update_notif["message"]

    # Organizer deletes event
    del_res = client.delete(f"/events/{event_id}", headers=auth_header(org_token))
    assert del_res.status_code == 204

    # Grace should receive cancellation notification
    notifs_after = client.get("/notifications/me", headers=auth_header(grace_token))
    cancel_notif = next((n for n in notifs_after.json() if n["notification_type"] == "cancellation"), None)
    assert cancel_notif is not None



