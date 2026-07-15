# CPS Authentication and Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing CPS IAM authentication flow so login and `/auth/me` return sanitized user/access-control data, refresh/logout are secure, and backend permission guards enforce effective permissions.

**Architecture:** Keep the existing `iam` schema and entity model. Add focused access-control services over the existing assignment, role, menu, permission, and direct-permission tables; keep `AuthService` as the orchestration layer. Use JWT only for identity/session context and query permissions outside the token.

**Tech Stack:** NestJS 11, TypeScript, TypeORM 0.3, PostgreSQL, JWT, Passport, bcrypt, class-validator, pnpm, Jest, Supertest.

## Global Constraints

- Keep PostgreSQL schema `iam`; do not create access-control tables in `public`.
- Do not use UUID; retain BIGINT identity primary keys.
- Preserve existing department selection/switching behavior.
- Never return or log passwords, password hashes, refresh tokens, or token hashes.
- Use bcrypt for password comparison and refresh-token hashing.
- Keep menus and permissions out of JWT payloads.
- Use additive migrations; do not edit committed migrations.
- Use `menu.code` and `permission.code` for authorization checks.

### Task 1: Add focused access-control evaluation and menu-tree tests

**Files:**
- Create: `src/modules/access-control/access-control.service.spec.ts`
- Create: `src/modules/access-control/services/effective-permission.service.spec.ts`
- Create: `src/modules/access-control/services/menu-tree.service.spec.ts`

**Interfaces:**
- `EffectivePermissionService.getEffectivePermissionCodes(userId: string, assignmentId?: string): Promise<string[]>`
- `MenuTreeService.buildMenuTree(menus: Menu[], permissionCodes: string[], isSuperAdmin: boolean): MenuResponse[]`

- [ ] **Step 1: Write failing tests** for duplicate role permissions, direct active grants, inactive grants, accessible child adding its parent, sorted children, duplicate menu prevention, and super-admin access.
- [ ] **Step 2: Run the focused Jest files** with `pnpm test -- --runInBand src/modules/access-control/services/effective-permission.service.spec.ts src/modules/access-control/services/menu-tree.service.spec.ts`; confirm failures are caused by missing services/behavior.
- [ ] **Step 3: Keep the failing tests as the behavioral contract** before adding production implementation.

### Task 2: Implement effective permissions and menu tree

**Files:**
- Create: `src/modules/access-control/services/effective-permission.service.ts`
- Create: `src/modules/access-control/services/menu-tree.service.ts`
- Create: `src/modules/access-control/access-control.service.ts`
- Create: `src/modules/access-control/access-control.module.ts`
- Modify: `src/entities/iam/menu.entity.ts`
- Modify: `src/entities/iam/permission.entity.ts`
- Modify: `src/entities/iam/role-action.entity.ts` or the closest existing role-menu relation entity after confirming its mapping

**Interfaces:**
- Query all relevant assignments/roles/permissions in bounded queries, deduplicate codes with `Set`, and return stable sorted results.
- Build response fields `id`, `code`, `name`, `nameEn`, `path`, `icon`, `menuType`, `sortOrder`, `permissions`, and `children`.

- [ ] **Step 1: Implement the minimal query-backed effective-permission service** using the existing `user_department_roles`, role permission relation, and `user_department_permissions` mappings.
- [ ] **Step 2: Implement menu filtering/tree construction** with active/visible checks, permission intersection, ancestor inclusion, cycle protection, duplicate prevention, and `sortOrder` sorting.
- [ ] **Step 3: Wire repositories in `AccessControlModule` and export the service.**
- [ ] **Step 4: Run the Task 1 tests** and confirm they pass.

### Task 3: Align password, JWT, refresh-session, and audit behavior

**Files:**
- Modify: `package.json`
- Modify: `src/modules/auth/auth.service.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `src/modules/auth/auth.module.ts`
- Modify: `src/modules/auth/strategies/jwt.strategy.ts`
- Modify: `src/common/interfaces/jwt-payload.interface.ts`
- Modify: `src/entities/iam/auth-session.entity.ts`
- Modify: `src/entities/iam/user.entity.ts`
- Modify: `src/entities/iam/audit-log.entity.ts`
- Modify: `src/common/exceptions/custom-exceptions.ts`
- Create: `src/modules/auth/services/password.service.ts`
- Create: `src/modules/auth/services/token.service.ts`

- [ ] **Step 1: Add bcrypt dependency and write failing auth-service tests** for successful login, invalid username/password, inactive user, locked user, and sanitized response.
- [ ] **Step 2: Run the auth tests** and verify the new expectations fail for the current argon2/placeholder behavior.
- [ ] **Step 3: Implement bcrypt password comparison and consistent invalid-credential handling** while retaining lockout counters.
- [ ] **Step 4: Implement token/session rotation** with hashed refresh tokens, token id/session id payload, expiry checks, status checks, and revocation.
- [ ] **Step 5: Update login timestamp and create login audit records** without sensitive fields.
- [ ] **Step 6: Implement `refresh-token`, `logout`, and `/me` contracts** while preserving legacy aliases only when they do not conflict.
- [ ] **Step 7: Run focused auth tests** and confirm they pass.

### Task 4: Enforce backend permissions

**Files:**
- Create: `src/common/guards/permissions.guard.ts`
- Modify: `src/common/guards/permission.guard.ts`
- Modify: `src/common/decorators/require-permissions.decorator.ts`
- Modify: `src/common/guards/jwt-auth.guard.ts`
- Modify: `src/app.module.ts`
- Create: `src/common/guards/permissions.guard.spec.ts`

- [ ] **Step 1: Write failing guard tests** for no metadata, super-admin, allowed effective permission, and 403 denied permission.
- [ ] **Step 2: Run the guard tests** and confirm the current guard fails the allowed case.
- [ ] **Step 3: Inject the effective-permission service and implement metadata-based checks** with a 403 permission exception.
- [ ] **Step 4: Register the intended guard in the existing protected endpoint flow** without weakening authentication or department scope.
- [ ] **Step 5: Run guard and existing module tests.**

### Task 5: Complete API DTOs, Swagger, documentation, and integration coverage

**Files:**
- Modify: `src/modules/auth/dto/login.dto.ts`
- Modify: `src/modules/auth/dto/refresh-token.dto.ts`
- Create or modify: `src/modules/auth/dto/login-response.dto.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `API_ENDPOINTS.md`
- Modify: `FRONTEND-INTEGRATION.md`
- Modify: `test/app.e2e-spec.ts`
- Create: `test/auth.e2e-spec.ts`

- [ ] **Step 1: Add DTO validation and Swagger decorators** for login, refresh, logout, and response models.
- [ ] **Step 2: Add integration tests** covering login response shape, refresh success/revocation, logout revocation, `/me`, and protected permission behavior.
- [ ] **Step 3: Document frontend menu-tree and flat-permission consumption** using code-based checks.
- [ ] **Step 4: Run `pnpm lint`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`; fix all failures.**

## Verification Matrix

- Effective permission unit tests: role union, direct allow, direct deny, duplicate removal, super-admin.
- Menu tree unit tests: active/visible filtering, parent inclusion, sorting, cycle/duplicate protection.
- Auth tests: success, invalid credentials, inactive, locked, no/multiple roles, no/multiple departments, sanitized output.
- Token tests: refresh success, revoked/expired refresh rejection, status recheck, logout revoke.
- Guard tests: required permission allow/deny and super-admin bypass.
- Full verification: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`.
