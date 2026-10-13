-- CampusHUB service-owned schema sketch (SQLite-compatible types)
-- Each table is owned by exactly one service. Cross-service references are IDs/contracts;
-- in a true independently deployed service architecture, enforce these references through APIs/events,
-- not cross-database foreign keys. This single-database benchmark includes FKs for the assignment ER diagram.
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','organizer','admin')),
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  description TEXT,
  date_time TIMESTAMP,
  capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0),
  status VARCHAR(30) DEFAULT 'upcoming',
  owner_id INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE clubs (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(160) NOT NULL UNIQUE,
  short_name VARCHAR(80),
  category VARCHAR(100) NOT NULL,
  committee VARCHAR(120),
  description TEXT,
  lead VARCHAR(120),
  faculty_coordinator VARCHAR(120),
  contact_email VARCHAR(255),
  members_count INTEGER NOT NULL DEFAULT 1,
  tags TEXT,
  image TEXT,
  cover_image TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  student_name VARCHAR(120),
  student_email VARCHAR(255),
  student_roll VARCHAR(40),
  department VARCHAR(100),
  ticket_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','cancelled')),
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (event_id, student_id)
);

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  published_by_user_id INTEGER NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
  event_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX ix_events_owner_id ON events(owner_id);
CREATE INDEX ix_registrations_event_id ON event_registrations(event_id);
CREATE INDEX ix_registrations_student_id ON event_registrations(student_id);
CREATE INDEX ix_notifications_recipient_read ON notifications(recipient_user_id, is_read);
