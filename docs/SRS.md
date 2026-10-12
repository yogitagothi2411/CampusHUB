Software Requirements Specification (SRS)

campusEventHUB --- College Event, Club & Activity Platform

Project type: College Event, Club & Activity Discovery/Management
System
Frontend: React + Vite + JavaScript + Tailwind CSS
Backend: Python FastAPI --- future phase only
Database: To be selected during backend design
Current implementation: Frontend with centralized mock/local data

1. Introduction

1.1 Purpose

campusEventHUB provides one centralized place for students to discover
college events and activities and for authorized organizers/admins to
manage the platform's event and activity information.

The system covers events such as:

Cultural events

Hackathons

Sports

Workshops

Seminars

Placement/career events

Fests

Technical competitions

Club activities

Innovation and design activities

Literature activities

Other college activities

1.2 Goals

The system should:

Make college activities easy to discover.

Provide clear event information.

Make registration simple.

Allow organizers to manage their events.

Allow admins to manage centralized college data.

Preserve useful information about completed events.

Keep the frontend simple and maintainable.

Keep the data model reusable for other colleges.

1.3 Scope Boundary

The current development stage is frontend only.

No real:

FastAPI backend

Database

JWT authentication

Server-side CRUD

File upload API

Production deployment

will be implemented until the frontend is completed and tested.

2. User Roles

2.1 Student

A student can:

Log in through the Student flow.

View the student dashboard.

Search events.

Filter events.

Browse categories.

Browse clubs.

View event details.

Register for events using mock frontend behavior.

View past events.

View completed-event photos/achievements/winners when available.

View profile information.

2.2 Organizer

An organizer is a college student, club member, or authorized
club/committee representative.

An organizer can:

Log in.

View dashboard statistics.

View their events.

Create an event.

Edit an event.

Manage an event.

View registrations.

Add completed-event information in mock mode.

View profile information.

2.3 Admin

An admin manages platform-level information.

An admin can:

Log in.

View dashboard statistics.

Manage events.

Manage students.

Manage organizers.

Manage clubs.

Manage categories.

View reports.

View profile information.

All current role behavior is frontend/mock behavior.

3. IIIT Vadodara Domain Model

The initial dataset should represent the IIIT Vadodara ecosystem using
documented public information.

Examples of event/activity records:

Kreiva

Alfaaz

Cerebro

HackIIITV

OLYMPUS

Tesseract/coding activities

Ideathon

Design activities

Technical workshops

Coding competitions

Cultural competitions

Sports activities

Examples of clubs/committees:

Coding Club

Enigma

DOT

Finance & Consulting Club

MOD5

Encore

Masquerade

Obscura

Shades

Pensieve

Editorial

Technical Committee

Cultural Committee

Sports Committee

Data integrity rule

Historical/publicly documented events must be represented as historical
records when appropriate.

Never convert a historical event into an upcoming event merely to
populate the UI.

Do not invent:

Dates

Venues

Winners

Registration counts

Official membership

Organizer identity

Current status

when those facts are not established.

Mock/demo fields must be clearly treated as mock data.

4. Functional Requirements

FR-01 --- Login Selection

The application shall provide a role selection/login entry point for:

Student

Organizer

Admin

FR-02 --- Student Login

The frontend shall provide a Student Login page.

Authentication is mock-only during frontend development.

FR-03 --- Organizer Login

The frontend shall provide an Organizer Login page.

Authentication is mock-only.

FR-04 --- Admin Login

The frontend shall provide an Admin Login page.

Authentication is mock-only.

FR-05 --- Student Dashboard

Student dashboard shall provide:

Search

Current/upcoming events

This week

This month

Browse by category

Club discovery/featured clubs

Past event/achievement preview where appropriate

FR-06 --- Event Search

Students shall be able to search by event name and relevant searchable
event information.

FR-07 --- Event Filtering

Students shall be able to filter by:

Category

Club

Date

Event status

Event period

Supported event periods:

Current

This Week

This Month

Past

FR-08 --- Browse by Category

The application shall provide visual category browsing.

Supported category data:

Technical

Hackathon

Cultural

Literature

Sports

Workshop

Seminar

Placement

Innovation

Design

Finance

Club Activity

FR-09 --- Event Details

Event details shall display, where available:

Event name

Image

Category

Club

Description

Date

Time

Venue

Organizer

Registration limit

Registered count

Status

For completed events, display:

Photos

Achievement/result

Winner

Runner-up

Only fields available in the data should be displayed.

FR-10 --- Event Registration

Students shall be able to perform mock registration.

Expected frontend behavior:

Register → Registered

Registration data is local/mock until backend integration.

FR-11 --- Club Discovery

Students shall be able to browse clubs and committees.

Club cards may show:

Club name

Type

Short description

Event count

Recent event

FR-12 --- Club Details

A club detail page shall show:

Club information

Upcoming events

Past events

Related activities

FR-13 --- Past Events

Students shall be able to browse completed/historical events.

Past event pages should preserve:

Event details

Photos where available

Achievements

Winner

Runner-up

Club/organizer information where available

FR-14 --- Student Profile

Provide a lightweight frontend profile page.

No real account-management backend is required at this stage.

FR-15 --- Organizer Dashboard

Organizer dashboard shall display lightweight statistics:

Total events

Upcoming events

Completed events

Total registrations

Statistics must be derived from centralized mock data.

FR-16 --- Organizer Event List

Organizer shall be able to view events associated with their
organizer/club context.

FR-17 --- Create Event

Organizer shall have a frontend form for:

Event name

Category

Club

Image

Description

Date

Time

Venue

Registration limit

Mock creation may update local/in-memory state as appropriate.

FR-18 --- Edit Event

Organizer shall be able to edit event information in mock mode.

FR-19 --- Manage Event

Organizer shall be able to manage:

Status

Event information

Completed-event information

Completed-event fields may include:

Photos

Achievement

Winner

Runner-up

FR-20 --- View Registrations

Organizer shall be able to view mock registration records for their
events.

FR-21 --- Organizer Profile

Provide a lightweight organizer profile page.

FR-22 --- Admin Dashboard

Admin dashboard shall display:

Total events

Upcoming events

Completed events

Total students

Total organizers

Total clubs

Total registrations

A lightweight recent-activity section may show:

New event

New organizer

New registration

Completed event

Avoid unnecessary charts.

FR-23 --- Admin Event Management

Admin shall be able to inspect event records and provide mock actions
for:

View

Edit

Delete

Change status

Admin event filters:

Search

Category

Club

Status

Year

FR-24 --- Admin Student Management

Admin student list may show:

Name

Email

Department/course

Registration count

Status

Mock actions:

View

Edit

Activate

Deactivate

FR-25 --- Admin Organizer Management

Admin organizer list may show:

Name

Email

Club

Event count

Status

Mock actions:

View

Edit

Activate

Deactivate

FR-26 --- Admin Club Management

Admin shall be able to mock:

Add club

Edit club

Deactivate club

View club

FR-27 --- Admin Category Management

Admin shall be able to view/manage supported categories in mock mode.

FR-28 --- Admin Reports

Admin reports shall provide lightweight summaries such as:

Events by category

Events by club

Upcoming vs completed

Registrations

Active clubs

Events by year

Organizer event counts

Prefer cards/tables. A chart library is optional and should not be added
unless necessary.

FR-29 --- Navigation

Each role shall have a consistent navigation layout.

Student

Dashboard
Events
Clubs
Categories
Past Events
Profile
Logout

Organizer

Dashboard
My Events
Create Event
Registrations
Profile
Logout

Admin

Dashboard
Events
Students
Organizers
Clubs
Categories
Reports
Profile
Logout

FR-30 --- Responsive UI

The application shall work on:

Desktop

Tablet

Mobile

5. Non-Functional Requirements

NFR-01 --- Usability

The interface should be understandable without excessive instructions.

NFR-02 --- Maintainability

Use centralized data and reusable components.

NFR-03 --- Performance

Avoid unnecessary libraries, repeated data, excessive rendering, and
heavy visual effects.

NFR-04 --- Consistency

The same event record must be used across:

Student pages

Organizer pages

Admin pages

Reports

NFR-05 --- Accessibility Basics

Use:

Readable contrast

Labels for form inputs

Keyboard-friendly controls where practical

Meaningful button labels

Appropriate image alt text

NFR-06 --- Error Handling

Show simple:

Empty states

Not-found states

Validation messages

Loading-like states where needed

Do not over-engineer error handling during the mock-data stage.

6. Data Requirements

Preferred centralized data files:

src/data/
├── events.js
├── clubs.js
├── categories.js
├── users.js
└── registrations.js

Suggested event fields:

{
  id,
  name,
  category,
  clubId,
  description,
  image,
  date,
  time,
  venue,
  organizer,
  registrationLimit,
  registeredCount,
  status,
  year,
  isHistorical,
  photos,
  achievement,
  winner,
  runnerUp
}

Suggested club fields:

{
  id,
  name,
  type,
  description,
  category,
  image
}

Suggested user fields:

{
  id,
  name,
  email,
  role,
  clubId,
  status
}

The exact implementation may differ, but the same concepts must use the
same names throughout the application.

7. Route Requirements

/
 /student/login
 /organizer/login
 /admin/login

 /student/dashboard
 /student/events
 /student/events/:eventId
 /student/clubs
 /student/clubs/:clubId
 /student/categories
 /student/past-events
 /student/profile

 /organizer/dashboard
 /organizer/events
 /organizer/events/create
 /organizer/events/:eventId/edit
 /organizer/events/:eventId/manage
 /organizer/events/:eventId/registrations
 /organizer/profile

 /admin/dashboard
 /admin/events
 /admin/events/:eventId
 /admin/students
 /admin/organizers
 /admin/clubs
 /admin/categories
 /admin/reports
 /admin/profile

8. UI Requirements

Use:

Soft pastel background

Blush pink

Lavender

Powder blue

Soft peach

Muted mauve

Dark readable text

Do not make every section pink.

Prefer:

Event cards

Category cards

Club cards

Badges

Compact statistics

Tables for admin data

Simple forms

Clear empty states

Avoid:

Excessive animation

Excessive gradients

Excessive shadows

Large blocks of text

Unnecessary modal chains

Unnecessary dependencies

