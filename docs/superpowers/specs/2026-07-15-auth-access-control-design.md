# CPS Authentication and Access Control Design

## Decision

Keep the existing PostgreSQL schema `iam`. Extend the existing NestJS authentication and RBAC implementation instead of introducing a parallel `access_control` module.

## Architecture

`AuthService` remains the orchestration boundary for login, refresh, logout, and current-user responses. Effective permissions are calculated in a focused service from active role assignments and direct user overrides. A menu-tree service filters active/visible menus, adds accessible ancestors, removes duplicates, and builds a sorted tree. JWTs contain only identity and session context; menus and permissions are loaded from the database for login and `/auth/me`.

The current department-assignment model remains the source of department and role membership. Existing `user_department_permissions` is retained for direct grants; its `isActive` flag and assignment scope represent the current schema's equivalent of direct permission overrides. A new additive migration is used only where the existing tables/entities lack required fields.

## API Contract

- `POST /api/v1/auth/login` returns authentication tokens, sanitized user data, departments, roles, a nested menu tree, and flat effective permission codes.
- `POST /api/v1/auth/refresh-token` validates the signed refresh token, verifies its persisted session/hash and current user status, revokes the old session, and issues a replacement pair.
- `POST /api/v1/auth/logout` revokes the session identified by the access token.
- `GET /api/v1/auth/me` returns the same user/access-control shape as login without issuing a refresh token.
- Existing department selection/switching endpoints remain compatible.

## Security and Authorization

Use bcrypt for password comparison and refresh-token hashing. Do not log passwords, hashes, or tokens. Invalid username/password uses one error. Inactive and locked users have distinct errors. `JwtAuthGuard` authenticates access tokens; `PermissionsGuard` reads `@RequirePermissions(...)`, grants all access to `SUPER_ADMIN`, and otherwise checks effective permissions from the database. Deny/direct overrides take precedence over role grants where represented by the existing schema.

## Testing

Add focused unit tests for effective permission precedence and menu-tree construction, auth service tests for successful/failed login and refresh/logout behavior, and guard tests for super-admin, allowed, and denied requests. Preserve existing tests and run lint, unit tests, e2e tests, and build.
