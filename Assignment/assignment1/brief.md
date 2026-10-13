# CampusEventHub — Project Brief

## What the system does
CampusEventHub is a college event-management platform. It is intended to provide one place where students can discover campus events and register for them. Event organizers can create and manage event information, while administrators can oversee users and platform activity. The goal is to make campus event information easier to find and event registration easier to manage.

The current frontend is built with React and Vite. The project archive includes a FastAPI Event Service prototype that exposes HTTP endpoints for checking service health, listing events, retrieving one event, and creating an event. In that prototype, event data is stored in an in-memory list, so it is temporary and resets when the service restarts. Other domains described in project documentation are planned functionality unless separately implemented.

## Who uses it?
- **Students:** browse events, view event details, and register for events.
- **Event organizers:** create and maintain event details and manage event participation.
- **Administrators:** oversee users, event categories, clubs, and reports.
- **External services / frontend clients:** call backend endpoints over HTTP and exchange JSON representations.

## Nouns — things, resources, and service concepts
- **User / Student** — a person who uses the platform.
- **Organizer** — a user who manages campus events.
- **Event** — an activity with details such as name, category, and venue.
- **Registration** — a student's request to participate in an event.
- **Club** — a campus group that may organize events.
- **Category** — a label used to classify events.
- **Admin** — a privileged platform operator.
- **Event Service** — the implemented FastAPI prototype for event-related endpoints.
- **Registration Service** — a service/API domain used in the web-services assignments.
- **HTTP request/response** — the communication messages exchanged by a client and server.
- **JSON representation** — the format used to exchange structured data.

## Verbs — actions, tasks, and API contracts
- **Check health:** `GET /health` — report whether the Event Service is healthy.
- **List events:** `GET /events` — return the available events.
- **Retrieve an event:** `GET /events/{event_id}` — return one event or a `404 Not Found` response.
- **Create an event:** `POST /events` — submit event data and create an event; a successful creation should return `201 Created`.
- **Discover events:** allow students to browse event information.
- **Register for an event:** submit a registration request (planned platform behavior / separate assignment API).
- **Manage events:** allow authorized organizers to create or update event information (full authorization depends on implementation).
- **Manage clubs and categories:** maintain the groups and labels used by the platform (planned domain functionality).
- **Administer users:** review or update user status and reports (planned domain functionality).

## Web-service communication
The client sends an HTTP request to a URL. The request includes a method, path, and headers; a request body may be included for operations such as creating an event. The server sends an HTTP status code, response headers such as `Content-Type`, and usually a JSON response body. `GET` is used for reading resources and `POST` for submitting data or creating a resource.

**Scope note:** The project has an implemented Event Service prototype and additional documented/planned domains. Do not claim that every domain listed above is already a separate deployed microservice.
