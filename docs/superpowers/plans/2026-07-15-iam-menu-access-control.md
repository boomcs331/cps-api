# IAM Menu Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy menu API with a transactional IAM menu/permission management API while preserving existing authentication and user/role permission assignments.

**Architecture:** Keep `iam` as the database schema and evolve the existing menu/permission tables with additive migrations. The `MenusController` exposes the requested routes, `MenusService` owns validation and transactions, repositories/query helpers own database access, and the existing `PermissionGuard` reads the evolved permission catalog by code. All tree responses use explicit typed DTO/response interfaces.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, pnpm, class-validator/class-transformer, Swagger, Jest, Supertest.

## Global Constraints

- Use `iam` for all menu, permission, and menu-permission tables; do not create tables in `public` or `access_control`.
- Do not edit committed migrations; add a sequential TypeORM migration.
- Use BIGINT/BIGSERIAL-compatible identifiers, never UUID.
- Use `QueryRunner` for multi-table create/update/status/delete operations.
- Do not use `any`, SQL string concatenation, or unvalidated external input.
- Preserve JWT authentication and Super Admin bypass.
- Write a failing test before each production behavior and run type-check, lint, unit, and e2e verification before completion.

---

### Task 1: Isolate the implementation workspace and establish baseline

**Files:**
- Read: `package.json`, `src/app.module.ts`, `src/modules/menus/*`, `src/entities/iam/*`, `src/database/migrations/*`
- Create/modify: an isolated `codex/iam-menu-access-control` worktree/branch only if the repository workflow permits it

**Interfaces:**
- Produces a clean baseline and an isolated workspace for all subsequent tasks.

- [ ] **Step 1: Record baseline status and run existing tests**

Run:

```powershell
git status --short
pnpm test -- --runInBand
```

Expected: existing status is understood; any pre-existing failures are recorded before feature work.

- [ ] **Step 2: Confirm the test and build commands available in `package.json`**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: the baseline type-check result is recorded; do not attribute baseline errors to this feature.

- [ ] **Step 3: Commit only setup changes if any**

```powershell
git status --short
```

Expected: no unrelated files are staged.

### Task 2: Add IAM schema migration and compatible entities

**Files:**
- Create: `src/database/migrations/1700000000003-EvolveIamMenusForAccessControl.ts`
- Modify: `src/entities/iam/menu.entity.ts`
- Modify: `src/entities/iam/permission.entity.ts`
- Create: `src/entities/iam/menu-permission.entity.ts`
- Modify: `src/database/data-source.ts` only if entity discovery needs an explicit path

**Interfaces:**
- Produces `Menu`, `Permission`, and `MenuPermission` mappings with string IDs, `deletedAt/deletedBy`, parent relation, and permission links.

- [ ] **Step 1: Write migration-focused unit assertions for schema intent**

Add tests under `src/database/migrations/` only if the repository has a migration test harness; otherwise encode the migration checks in the e2e database test. The assertions must verify `iam.menu_permissions`, soft-delete columns, menu type constraints, and unique menu/path/permission indexes.

- [ ] **Step 2: Implement the migration**

The migration must:

```sql
CREATE TABLE iam.menu_permissions (... UNIQUE(menu_id, permission_id));
ALTER TABLE iam.menus ADD COLUMN IF NOT EXISTS component VARCHAR(500);
ALTER TABLE iam.menus ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE iam.menus ADD COLUMN IF NOT EXISTS deleted_by BIGINT;
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS permission_code VARCHAR(150);
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS permission_name VARCHAR(255);
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);
```

Backfill `permission_code` from the legacy `code`, backfill names/resource/action from existing action/menu values when available, then add non-null/unique constraints only after checking for conflicts. Add foreign keys and indexes with `IF NOT EXISTS` where PostgreSQL supports it, and implement a reverse `down` migration that removes only additions made by this migration.

- [ ] **Step 3: Update entities to match actual column names and relations**

Use `@Entity('...', { schema: 'iam' })`, `@PrimaryGeneratedColumn('increment', { type: 'bigint' })`, explicit snake_case column names, `TreeParent/TreeChildren`-style relations only if compatible with the existing TypeORM version, and typed `ManyToMany`/link entity relations. Keep legacy property aliases only where existing services still compile.

- [ ] **Step 4: Run type-check and migration compilation**

```powershell
pnpm exec tsc --noEmit
pnpm exec eslint "src/database/migrations/**/*.ts" "src/entities/iam/**/*.ts"
```

Expected: no new type or lint errors.

### Task 3: Create DTOs, enums, response types, and error codes

**Files:**
- Create/modify: `src/modules/menus/dto/create-menu.dto.ts`
- Create: `src/modules/menus/dto/create-submenu.dto.ts`
- Create: `src/modules/menus/dto/create-permission.dto.ts`
- Create: `src/modules/menus/dto/update-menu.dto.ts`
- Create: `src/modules/menus/dto/update-menu-status.dto.ts`
- Create: `src/modules/menus/dto/menu-query.dto.ts`
- Create: `src/modules/menus/dto/assign-menu-permission.dto.ts`
- Modify: `src/common/enums/menu-type.enum.ts`
- Modify: `src/common/enums/error-code.enum.ts`
- Create: `src/modules/menus/interfaces/menu-tree.interface.ts`

**Interfaces:**
- `CreateMenuDto` contains `menuCode`, names, `menuType`, optional route fields, `permissions: CreatePermissionDto[]`, and `submenus: CreateSubmenuDto[]`.
- `UpdateMenuDto` supports partial menu fields plus optional nested submenu/permission operations.
- `MenuQueryDto` validates `isActive`, `isVisible`, and `keyword`.
- All IDs are strings and numeric fields are transformed/validated integers.

- [ ] **Step 1: Write DTO validation tests first**

Test valid `MAIN_MENU` payloads, invalid code/path formats, invalid root/submenu enum values, duplicate submenu codes, duplicate permission codes, and `sortOrder < 0` using the repository validation pipe.

- [ ] **Step 2: Run the validation tests and confirm RED**

```powershell
pnpm test -- --runInBand src/modules/menus/dto/*.spec.ts
```

Expected: tests fail because the new DTO contract/validators are not implemented.

- [ ] **Step 3: Implement DTOs and enums**

Use `@IsString`, `@IsNotEmpty`, `@MaxLength`, `@Matches`, `@IsEnum`, `@IsOptional`, `@IsBoolean`, `@IsInt`, `@Min(0)`, `@ValidateNested({ each: true })`, and `@Type` with no `any` types. Add the requested error-code enum values.

- [ ] **Step 4: Run validation tests and type-check**

```powershell
pnpm test -- --runInBand src/modules/menus/dto/*.spec.ts
pnpm exec tsc --noEmit
```

Expected: DTO tests pass.

### Task 4: Implement repositories and transactional menu service

**Files:**
- Create: `src/modules/menus/repositories/menu.repository.ts`
- Create: `src/modules/menus/repositories/permission.repository.ts`
- Modify: `src/modules/menus/menus.service.ts`
- Create/modify: `src/modules/menus/menus.service.spec.ts`

**Interfaces:**
- `MenuRepository.findTree(query, manager): Promise<MenuTreeNode[]>`
- `MenuRepository.findTreeById(id, manager): Promise<MenuTreeNode | null>`
- `PermissionRepository.findOrCreateByCode(dto, actorId, manager): Promise<Permission>`
- `MenusService.create(dto, user): Promise<MenuTreeNode>`
- `MenusService.findTree(query): Promise<MenuTreeNode[]>`
- `MenusService.findOne(id): Promise<MenuTreeNode>`
- `MenusService.update(id, dto, user): Promise<MenuTreeNode>`
- `MenusService.updateStatus(id, dto, user): Promise<MenuTreeNode>`
- `MenusService.remove(id, user): Promise<void>`

- [ ] **Step 1: Write failing service tests**

Cover root-only creation, nested creation with reused/new permissions, duplicate menu/path/request codes, rollback on child failure, tree ordering, parent IDs, circular-reference rejection, soft-delete filtering, and main-menu status cascade. Mock only repository/query-runner boundaries, not the service behavior itself.

- [ ] **Step 2: Run service tests and confirm RED**

```powershell
pnpm test -- --runInBand src/modules/menus/menus.service.spec.ts
```

Expected: failures identify missing service behavior.

- [ ] **Step 3: Implement repository queries**

Use TypeORM parameters for all filters. Exclude `deleted_at IS NOT NULL`, apply optional active/visible/keyword predicates, load menu permissions through `menu_permissions`, and sort every sibling by `sort_order ASC, id ASC`.

- [ ] **Step 4: Implement `create` with `QueryRunner`**

Validate the complete in-memory request first; start one transaction; insert root; resolve permissions by code; insert links; insert submenus with root parent ID; commit; reload the tree through the transaction manager; rollback and translate known conflicts on every failure; release in `finally`.

- [ ] **Step 5: Implement reads, update, status cascade, and soft delete**

Updates must reject self/circular moves, synchronize only requested permission links, cascade status/deletion to descendants, and preserve rows physically. Tree output must be built from typed nodes and never include soft-deleted menus.

- [ ] **Step 6: Run service tests and type-check**

```powershell
pnpm test -- --runInBand src/modules/menus/menus.service.spec.ts
pnpm exec tsc --noEmit
```

Expected: service tests pass and compilation succeeds.

### Task 5: Replace controller/module wiring and integrate authorization

**Files:**
- Modify: `src/modules/menus/menus.controller.ts`
- Modify: `src/modules/menus/menus.module.ts`
- Modify: `src/app.module.ts`
- Modify: `src/modules/access-control/access-control.module.ts`
- Modify: `src/modules/access-control/access-control.service.ts`
- Modify: `src/modules/access-control/services/menu-tree.service.ts`
- Modify: `src/common/guards/permission.guard.ts` only if needed for the evolved permission property names

**Interfaces:**
- Routes use `JwtAuthGuard` plus `PermissionGuard`, with `@RequirePermissions('menu.read'|'menu.create'|'menu.update'|'menu.delete')` per operation.
- Controller resolves actor ID from `CurrentUserWithAssignment` and delegates all business behavior to service.

- [ ] **Step 1: Write controller/guard tests first**

Verify missing permission returns 403, Super Admin bypasses, create uses `menu.create`, reads use `menu.read`, and status/delete/update use their respective permissions.

- [ ] **Step 2: Run authorization tests and confirm RED**

```powershell
pnpm test -- --runInBand src/common/guards/permission.guard.spec.ts src/modules/menus/menus.controller.spec.ts
```

Expected: new route tests fail before controller wiring is updated.

- [ ] **Step 3: Implement controller routes and Swagger metadata**

Add `@ApiTags('menus')`, `@ApiBearerAuth()`, DTO decorators, explicit route decorators, and typed return declarations. Keep `GET /tree` before `GET /:id`.

- [ ] **Step 4: Wire entities, repositories, service, and guards in modules**

Export the service where current consumers need it, register evolved entities with `TypeOrmModule.forFeature`, and adapt access-control queries to use `permissionCode` while preserving IAM role/user assignment joins.

- [ ] **Step 5: Run authorization/controller tests and type-check**

```powershell
pnpm test -- --runInBand src/common/guards/permission.guard.spec.ts src/modules/menus/*.spec.ts
pnpm exec tsc --noEmit
```

Expected: all selected tests pass.

### Task 6: Add seed data and API documentation examples

**Files:**
- Modify: `src/database/seeds/seed.ts`
- Create: `docs/iam-menu-access-control-api.md`

**Interfaces:**
- Seed is idempotent and creates initial IAM menus and permission catalog records using parameterized SQL.
- Documentation includes request/response/error JSON, endpoint matrix, transaction flow, and file responsibilities.

- [ ] **Step 1: Write seed idempotency test or executable verification**

Run the seed twice against the configured test database and verify counts for menu codes, permission codes, and menu links do not increase on the second run.

- [ ] **Step 2: Implement parameterized IAM seed data**

Seed a main menu with user/department/permission submenus and the listed permission codes, using `ON CONFLICT` or explicit parameterized existence checks. Do not remove existing IAM records.

- [ ] **Step 3: Add API examples and flow documentation**

Document all six endpoints, validation/error codes, authorization rules, transaction rollback behavior, and the tree response shape.

- [ ] **Step 4: Verify seed/documentation changes**

```powershell
pnpm exec tsc --noEmit
git diff --check
```

Expected: no type or whitespace errors.

### Task 7: Add integration/e2e coverage and run full verification

**Files:**
- Modify: `test/app.e2e-spec.ts` or create `test/menus.e2e-spec.ts`
- Modify: `test/jest-e2e.json` only if test discovery requires it
- Modify: `.project-ai/api-map.md` only if that file is later added to this repository

**Interfaces:**
- Tests exercise real HTTP routes against the configured database or a test database connection, including auth headers and transaction-visible results.

- [ ] **Step 1: Add e2e tests for create/tree/detail/status/delete and 403**

Use Supertest to assert HTTP status, response shape, parent IDs, sorted siblings, permission reuse, rollback, soft-delete omission, status cascade, and unauthorized access.

- [ ] **Step 2: Run the focused e2e suite**

```powershell
pnpm test:e2e -- --runInBand
```

Expected: all menu e2e scenarios pass when PostgreSQL credentials are available; otherwise record the exact environment blocker.

- [ ] **Step 3: Run final verification commands**

```powershell
pnpm exec tsc --noEmit
pnpm exec eslint "{src,apps,libs,test}/**/*.ts"
pnpm test -- --runInBand
pnpm test:e2e -- --runInBand
pnpm run build
git diff --check
git status --short
```

Expected: exit code 0 for available checks, with any database-dependent skip reported explicitly.

- [ ] **Step 4: Review the final diff against the approved design**

Confirm no committed migration was edited, no `access_control` tables were introduced, no `any` was added, and all requested endpoints/error codes/tests/documentation are represented before claiming completion.
