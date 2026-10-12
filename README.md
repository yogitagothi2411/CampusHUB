# campusEventHUB

A full-stack campus event management platform for IIIT Vadodara.

## Monorepo Structure

```
campusEventHUB/
├── frontend/          # React + Vite frontend (Phases A–N)
├── backend/           # FastAPI backend (Phases O–Q)
├── docs/              # Project documentation & SRS
└── README.md          # This file
```

## Quick Start

### Frontend (currently active)
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

### Backend (planned — Phase O onwards)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Portals

| Role      | Route             | Login                        |
|-----------|-------------------|------------------------------|
| Student   | `/student/login`  | Any enrolled student         |
| Organizer | `/organizer/login`| Club organizer credentials   |
| Admin     | `/admin/login`    | `admin` / `admin123`         |

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4     |
| Routing    | React Router v7                     |
| Icons      | Lucide React                        |
| Backend    | FastAPI, SQLAlchemy, PostgreSQL      |
| Auth       | JWT (OAuth2)                        |

## Development Progress

See [`docs/Development_plan.md`](docs/Development_plan.md) for the full phase roadmap.

| Phase | Name                          | Status        |
|-------|-------------------------------|---------------|
| A     | Audit & Cleanup               | ✅ Complete    |
| B     | IIIT Vadodara Data Migration  | ✅ Complete    |
| C     | Student Frontend              | ✅ Complete    |
| D     | Organizer Frontend            | ✅ Complete    |
| E     | Admin Auth & Layout           | ✅ Complete    |
| F     | Admin Dashboard               | ✅ Complete    |
| G     | Admin Event Management        | ✅ Complete    |
| H     | Admin Student & Organizer Mgmt| ✅ Complete    |
| I     | Admin Club & Category Mgmt    | ✅ Complete    |
| J     | Admin Reports                 | ✅ Complete    |
| K     | Frontend Integration          | ✅ Complete    |
| L     | Data Consistency & Cleanup    | ✅ Complete    |
| M     | Responsive/UI Refinement      | ✅ Complete    |
| N     | Final Frontend QA             | ✅ Complete    |
| O     | FastAPI Backend Planning      | 🔲 Pending     |
| P     | FastAPI Backend Implementation| 🔲 Pending     |
| Q     | React + FastAPI Integration   | 🔲 Pending     |