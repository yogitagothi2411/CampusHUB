from fastapi.testclient import TestClient
from app import app
from store import store

client = TestClient(app)

def reset_store():
    store._items.clear()
    store._idempotency.clear()
    store._next_id = 1


def test_create_has_201_and_location():
    reset_store()
    response = client.post('/registrations', json={'eventId':'evt-1','studentReference':'stu-1'})
    assert response.status_code == 201
    assert response.headers['location'] == '/registrations/1'
    assert response.json()['status'] == 'CONFIRMED'


def test_idempotent_repeat_returns_original():
    reset_store()
    body = {'eventId':'evt-1','studentReference':'stu-1'}
    first = client.post('/registrations', json=body, headers={'Idempotency-Key':'same-request'})
    second = client.post('/registrations', json=body, headers={'Idempotency-Key':'same-request'})
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json() == second.json()
    assert client.get('/registrations').json()['count'] == 1


def test_malformed_body_returns_400():
    reset_store()
    response = client.post('/registrations', content='not-json', headers={'Content-Type':'application/json'})
    assert response.status_code == 400
    assert set(response.json()) == {'type','title','status','detail'}


def test_unknown_id_returns_404():
    reset_store()
    response = client.get('/registrations/999')
    assert response.status_code == 404
    assert response.json()['status'] == 404


def test_list_filter_and_cancel_conflict():
    reset_store()
    made = client.post('/registrations', json={'eventId':'evt-1','studentReference':'stu-1'}).json()
    assert client.get('/registrations?eventId=evt-1').json()['count'] == 1
    assert client.post(f"/registrations/{made['id']}/cancellation").status_code == 200
    assert client.post(f"/registrations/{made['id']}/cancellation").status_code == 409


def test_conditional_get_and_stale_write():
    reset_store()
    made = client.post('/registrations', json={'eventId':'evt-1','studentReference':'stu-1'}).json()
    first = client.get(f"/registrations/{made['id']}")
    tag = first.headers['etag']
    not_modified = client.get(f"/registrations/{made['id']}", headers={'If-None-Match':tag})
    assert not_modified.status_code == 304
    stale = client.post(f"/registrations/{made['id']}/cancellation", headers={'If-Match':'\"old-tag\"'})
    assert stale.status_code == 412


def test_protected_demo_requires_bearer_header():
    response = client.get('/protected/demo')
    assert response.status_code == 401
