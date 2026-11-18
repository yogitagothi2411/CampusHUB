# GitHub integration instructions

1. Create one empty GitHub repository named `CampusEventHUB`.
2. Add the shared root `README.md`, `package.json`, `frontend/`, `docs/`, `backend/api-gateway/` and `backend/services/` structure from the integration starter.
3. Each member copies only their assigned service folders from their ZIP into the exact paths. Member 1 also owns `backend/api-gateway/` and root workspace scripts.
4. Use branches: `feature/auth-gateway-user`, `feature/event-club`, `feature/registration`, `feature/communication`.
5. Open PRs; resolve package.json/root conflicts by keeping the workspace root package from Member 1 and adding any missing dependencies/workspaces rather than replacing the whole file.
6. Merge all four PRs into `main`. Pull `main` on the integration computer and run root install/start commands from README.
7. Test gateway routes only after all services are running.
