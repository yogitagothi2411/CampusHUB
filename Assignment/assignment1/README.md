# CampusEventHub — CS543 Web Services Assignment 1

**Assignment:** HTTP by Hand & Project Setup  
**Course:** CS543 — Web Services  
**Project:** CampusEventHub

## Project overview
CampusEventHub is a college event-management platform intended to help students discover campus events and register for them, while organizers manage events and administrators oversee platform activity.

The current project frontend uses React and Vite. The project repository also contains a FastAPI Event Service prototype. The wider backend domains described in the project documentation (such as authentication, registrations, clubs, categories, and administration) are planned service areas and should not be described as independently deployed services unless they have actually been implemented and deployed.

## Repository structure

```text
CampusEventHub/
├── README.md
├── http-log.md
├── network-analysis.md
├── brief.md
└── docs/
    └── assignment-notes.md
```

The four assignment deliverables are kept at the repository root to match the assignment sheet. `docs/` contains supplementary notes.

## Assignment 1 deliverables

1. `http-log.md` — five annotated read-only JSON API requests, including a deliberate 404.
2. `network-analysis.md` — browser DevTools Network analysis. Complete the measured fields after a real browser reload.
3. `brief.md` — one-page project brief listing users, nouns, and verbs explicitly.
4. This README — project description and repository setup instructions.

## Setup the Git repository

Run these commands from the folder containing these files:

```bash
git init
git add README.md http-log.md network-analysis.md brief.md docs/
git commit -m "Create CampusEventHub project and Assignment 1 documents"
git add .
git commit -m "Document HTTP requests and browser network analysis"
git log --oneline
```

Create a repository on GitHub named `CampusEventHub` (or the name your instructor approves), then connect and push it:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/CampusEventHub.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username and use the actual repository URL. Do not submit the placeholder URL.

## Important evidence note
The HTTP examples in `http-log.md` are reproducible examples, not a live capture from this environment. Run the listed `curl -i` commands on your own computer and update the response headers/body to match what you actually receive. Similarly, `network-analysis.md` must be completed from your own browser's DevTools Network panel; request count, page size, and slowest resource vary by browser, cache state, and time.
