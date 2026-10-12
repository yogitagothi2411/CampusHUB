campusEventHUB Development Plan

1. Purpose

This document is the implementation roadmap for the current
campusEventHUB project.

The project is being developed frontend first.

The most important rule is:

Stabilize the existing project and establish one consistent IIIT
Vadodara data model before adding more features.

The previous phase numbering is intentionally replaced by this plan
because the existing code is already partially implemented and the old
documentation did not match the current project state.

2. Current Baseline

The existing frontend already contains substantial work for:

Student login

Organizer login

Student event discovery

Event details

Past events

Organizer dashboard

Organizer event list

Create event

Edit event

Manage event

Registrations

However, the current project also has inconsistencies and incomplete
areas.

Known issues include:

Student navigation is not yet the intended left-sidebar structure.

Student Clubs, Categories, and Profile pages are missing.

Organizer navigation is missing some required links.

Admin routes/pages do not exist yet.

Generic invented event data is still present.

Organizer mock data is separate from student event data.

mockEvents.js and mockOrganizerEvents.js create duplicate
sources of truth.

The service layer still contains premature FastAPI/Axios behavior.

ESLint currently reports errors in organizer pages and an unused
import.

README/SRS/development documentation previously described different
project scopes.

The uploaded project contains generated/dependency folders such as
node_modules/dist that should not be treated as source code.

Therefore, do not jump directly into Admin implementation.

3. New Phase Sequence

Phase A  → Audit, Bug Fixes & Project Cleanup
Phase B  → IIIT Vadodara Data Migration
Phase C  → Finish Student Frontend
Phase D  → Finish Organizer Frontend
Phase E  → Admin Authentication & Layout
Phase F  → Admin Dashboard
Phase G  → Admin Event Management
Phase H  → Admin Student & Organizer Management
Phase I  → Admin Club & Category Management
Phase J  → Admin Reports
Phase K  → Complete Frontend Integration
Phase L  → Data Consistency & Cleanup
Phase M  → Responsive/UI Refinement
Phase N  → Final Frontend QA
Phase O  → FastAPI Backend Planning
Phase P  → FastAPI Backend Implementation
Phase Q  → React + FastAPI Integration

4. Phase A --- Audit, Bug Fixes & Project Cleanup

Goal

Make the existing frontend stable before adding new functionality.

Tasks

A1 --- Inspect the project

Read:

README.md
docs/SRS.md
docs/Development_plan.md
package.json
src/

Understand the existing implementation before changing it.

A2 --- Fix current lint errors

Known issues include:

Unused Loader2 import in EventForm.jsx.

React hook/state-update lint errors in:

EditEvent.jsx

EventRegistrations.jsx

ManageEvent.jsx

OrganizerDashboard.jsx

OrganizerEvents.jsx

Fix them using clean React patterns.

Do not disable ESLint rules just to hide errors.

A3 --- Service layer cleanup

The frontend is not ready for FastAPI.

Change the current service behavior so that frontend development uses
local/mock data only.

Do not make requests to:

http://localhost:8000

during frontend-only phases.

Keep a simple service layer if useful, because it can later be replaced
with Axios/API calls.

A4 --- Remove unnecessary source files/assets

Inspect and remove unused starter assets/components if they are
genuinely unused.

Do not delete files only because they look unused; verify references
first.

Do not commit:

node_modules/
dist/

These are generated/dependency directories.

A5 --- Route audit

Verify current routes and remove inconsistent redirects/duplicate
destinations where practical.

Do not add all future routes yet.

A6 --- Documentation alignment

Replace the old README/SRS/development plan with the corrected versions
in this repository.

Exit criteria

ESLint errors fixed.

No unnecessary FastAPI calls.

No duplicate service behavior.

Existing working pages still work.

Documentation describes the same project scope.

No new feature work has been introduced.

5. Phase B --- IIIT Vadodara Data Migration

Goal

Create one clean, centralized, realistic dataset before building more
pages.

Tasks

Create:

src/data/events.js
src/data/clubs.js
src/data/categories.js
src/data/users.js
src/data/registrations.js

Replace the old duplicated datasets:

src/data/mockEvents.js
src/data/mockOrganizerEvents.js

only after all references are migrated.

Data requirements

Use IIIT Vadodara-oriented events/clubs based on documented public
information.

Examples:

Kreiva
Alfaaz
Cerebro
HackIIITV
OLYMPUS
Ideathon
Tesseract/coding activities
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

Important

Do not invent:

winners

exact venues

exact registration counts

exact current status

official club relationships

dates not supported by the available source

When information is historical, mark it as historical.

Use mock/demo values only where needed to make the UI functional, and
keep those values clearly separate from claims about real-world facts.

Exit criteria

One source of truth for events.

One source of truth for clubs.

Categories centralized.

Users/organizers centralized.

Registrations centralized.

Student and organizer pages use the same event records.

No duplicate event dataset remains.

6. Phase C --- Finish Student Frontend

Goal

Complete the Student role according to the SRS.

Required navigation

Dashboard
Events
Clubs
Categories
Past Events
Profile
Logout

Required pages

/student/dashboard
/student/events
/student/events/:eventId
/student/clubs
/student/clubs/:clubId
/student/categories
/student/past-events
/student/profile

Tasks

C1 --- Student layout

Implement the intended left sidebar.

Desktop:

Logo
Dashboard
Events
Clubs
Categories
Past Events
Profile
Logout

Mobile should use a compact responsive navigation.

C2 --- Student dashboard

Provide:

Search

Current events

This week

This month

Browse by category

Featured clubs

Past event/achievement preview

C3 --- Events page

Implement:

Search

Category filter

Club filter

Date filter

Status filter

Event-period filter

C4 --- Clubs

Implement:

Club listing

Club cards

Club detail page

Upcoming events

Past events

C5 --- Categories

Implement visual category browsing.

C6 --- Profile

Create a simple frontend profile page.

Exit criteria

Student can navigate through the complete Student flow using centralized
data.

7. Phase D --- Finish Organizer Frontend

Goal

Make the Organizer role complete and consistent.

Navigation

Dashboard
My Events
Create Event
Registrations
Profile
Logout

Tasks

Fix Organizer sidebar.

Add Registrations link.

Add Profile page.

Make dashboard use centralized event data.

Make My Events use centralized event data.

Make Create/Edit use the shared event model.

Make Manage Event update/mock completed-event information
consistently.

Make Registrations use centralized registration data.

Do not create a second organizer event dataset.

Exit criteria

Organizer flow works end-to-end in mock mode.

8. Phase E --- Admin Authentication & Layout

Goal

Introduce the Admin role only after Student and Organizer are stable.

Routes

/admin/login
/admin/dashboard

Tasks

Add Admin login UI.

Add AdminLayout.

Add left sidebar:

Dashboard
Events
Students
Organizers
Clubs
Categories
Reports
Profile
Logout

Add responsive behavior.

Keep visual language consistent with the rest of the application.

Exit criteria

Admin can enter the Admin dashboard through the mock login flow.

9. Phase F --- Admin Dashboard

Goal

Build a lightweight management dashboard.

Show:

Total Events
Upcoming Events
Completed Events
Students
Organizers
Clubs
Registrations

Add recent activity using centralized data.

Avoid unnecessary charts.

10. Phase G --- Admin Event Management

Routes

/admin/events
/admin/events/:eventId

Features

Search/filter:

Search

Category

Club

Status

Year

Event table:

Event
Category
Club
Organizer
Date
Status
Registrations
Actions

Mock actions:

View
Edit
Delete
Change Status

Completed-event information:

Photos
Achievement
Winner
Runner-up

11. Phase H --- Admin Student & Organizer Management

Routes

/admin/students
/admin/organizers

Students

Display:

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

Organizers

Display:

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

12. Phase I --- Admin Club & Category Management

Routes

/admin/clubs
/admin/categories

Clubs

Mock:

Add

Edit

View

Deactivate

Categories

Mock:

View

Add

Edit

Activate/deactivate where useful

All changes should use centralized frontend state/data patterns.

13. Phase J --- Admin Reports

Route

/admin/reports

Provide lightweight summaries:

Events by category

Events by club

Upcoming vs completed

Registrations

Active clubs

Events by year

Organizer event counts

Prefer:

Cards

Tables

Simple summaries

Do not add a chart library unless it is genuinely necessary.

14. Phase K --- Complete Frontend Integration

Verify all role flows.

Student

Login
↓
Dashboard
↓
Events
↓
Search/Filter
↓
Clubs
↓
Club Details
↓
Event Details
↓
Register
↓
Past Events
↓
Profile

Organizer

Login
↓
Dashboard
↓
My Events
↓
Create
↓
Edit
↓
Manage
↓
Registrations
↓
Profile

Admin

Login
↓
Dashboard
↓
Events
↓
Students
↓
Organizers
↓
Clubs
↓
Categories
↓
Reports
↓
Profile

Fix broken navigation, stale links, inconsistent routes, and missing
empty states.

15. Phase L --- Data Consistency & Cleanup

This is a dedicated data-quality phase.

Verify:

Every event references a valid category.

Every event references a valid club where applicable.

Every club event count is derived correctly.

Organizer event lists match the central event dataset.

Student event lists match the central event dataset.

Admin statistics match the central event dataset.

Past events are marked completed/historical correctly.

Upcoming events are not accidentally historical.

Registration counts are consistent.

Winner/achievement data appears only when present.

No page contains a hard-coded duplicate event object.

No old generic demo dataset remains unless intentionally retained as
a clearly labeled generic fallback.

16. Phase M --- Responsive/UI Refinement

Check:

Desktop

Tablet

Mobile

Review:

Sidebar

Header

Cards

Tables

Forms

Buttons

Search

Filters

Empty states

Image sizing

Text overflow

Mobile navigation

Spacing

Typography

Keep the pastel design subtle and professional.

Do not add large visual redesigns unless required.

17. Phase N --- Final Frontend QA

No new features.

Functional QA

Test:

Login selection

Student login

Organizer login

Admin login

Student routes

Organizer routes

Admin routes

Search

Filters

Category browsing

Club browsing

Event details

Registration mock behavior

Organizer create/edit/manage behavior

Registration list

Admin management

Reports

Code QA

Check:

ESLint

Console errors

Console warnings

Broken imports

Broken routes

Duplicate components

Duplicate mock data

Dead files

Unused dependencies

Naming consistency

Build QA

On the developer machine, use a clean dependency installation if the
existing node_modules is stale/broken:

npm install
npm run lint
npm run build

Do not change dependency versions merely to work around a broken
uploaded node_modules directory unless there is a real package
problem.

Exit criteria

The frontend is considered complete.

18. Phase O --- FastAPI Backend Planning

Only after Phase N is complete.

Define:

Database

Authentication model

User roles

Event schema

Club schema

Category schema

Registration schema

Completed-event schema

API routes

Validation

Authorization

Image/file strategy

This phase should be planning/design only.

19. Phase P --- FastAPI Backend Implementation

Implement later:

FastAPI application

Database

Models

Schemas

CRUD

Authentication

Authorization

Registration APIs

Admin APIs

Organizer APIs

Student APIs

This is outside the current frontend work.

20. Phase Q --- React + FastAPI Integration

Replace mock services with API services.

Final architecture:

React
  ↓
Axios/service layer
  ↓
FastAPI
  ↓
Database

At this point:

Remove mock-only service behavior.

Add real authentication handling.

Connect event CRUD.

Connect clubs.

Connect registrations.

Connect admin/organizer management.

Test frontend/backend integration.

