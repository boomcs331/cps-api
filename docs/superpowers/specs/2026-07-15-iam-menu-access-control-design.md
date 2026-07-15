# IAM Menu and Access Control Design

## Goal

Replace the existing menu-management API with a compatibility-preserving module that uses the existing `iam` schema and authentication model. The module manages hierarchical menus, a reusable permission catalog, and menu-permission links while preserving role/user assignment behavior used by the current permission guard.

## Scope

- Replace the existing `menus` module behavior and route contract with the requested `/api/v1/menus` endpoints.
- Keep existing `iam.users`, roles, actions, user-department assignments, and authentication/session tables.
- Extend the IAM menu/permission data model through new migrations; do not edit committed migrations.
- Support create, tree/detail reads, update, status cascade, and soft delete.
- Add validation, Swagger metadata, permission authorization, seed data, unit tests, and integration/e2e coverage where the repository setup permits.

## Data model

`iam.menus` remains the hierarchical menu table. A new migration evolves its legacy column names and values to the API contract (`menu_code`, `menu_name`, `menu_name_en`, `menu_type`, `component`) while retaining BIGINT identifiers and the self-reference. It adds `deleted_at` and `deleted_by`, check constraints for menu type and parent rules, and indexes for code, parent, path, active/visible state, and order.

`iam.permissions` becomes the reusable permission catalog. It gains `permission_code`, `permission_name`, `resource`, and `action` data required by the new API. Existing assignment tables continue to reference permission IDs. Legacy columns are retained or made compatibility-safe during migration so current authorization data is not silently discarded.

`iam.menu_permissions` is added as a many-to-many link table with foreign keys, unique `(menu_id, permission_id)`, audit creator, and indexes. Permission records are resolved by code: existing records are reused; absent records are created within the same transaction.

## API and authorization

- `POST /api/v1/menus`: creates a main menu, nested submenus, permissions, and links atomically.
- `GET /api/v1/menus/tree`: returns ordered tree data with optional `isActive`, `isVisible`, and `keyword` filters.
- `GET /api/v1/menus/:id`: returns one complete menu tree node.
- `PATCH /api/v1/menus/:id`: updates menu data and nested permission/submenu changes atomically.
- `PATCH /api/v1/menus/:id/status`: updates active state; disabling a main menu disables descendants.
- `DELETE /api/v1/menus/:id`: soft-deletes the node and its descendants without physical deletion.

All protected routes use JWT plus the existing `PermissionGuard` with `@RequirePermissions`. Super Admin keeps the existing bypass. The logged-in user ID is used for `createdBy`/`updatedBy`/`deletedBy` audit fields.

## Business rules and errors

The service validates unique menu codes, non-null unique paths, request root type, submenu type, parent ownership, self-reference, circular-reference prevention, duplicate request codes, and duplicate menu-permission links. Errors use the repository's `CustomHttpException`/`ErrorCode` pattern and add the requested menu/permission conflict codes without exposing SQL errors.

## Implementation structure

The replacement module keeps the repository's current module layout unless a local convention requires otherwise. It separates controller, service, DTOs, entities, repositories/query helpers, tree response interfaces, and error constants. The existing access-control services are adapted to read the evolved IAM permission/menu model so menu permissions remain visible to authorization and menu-tree consumers.

## Transaction and failure behavior

Create and update operations use a TypeORM `QueryRunner`. The transaction is started after connection, all menu/permission/link writes use the runner manager, and commit occurs only after the complete tree is persisted. Any validation or persistence failure rolls back all writes; runner release is guaranteed in `finally`.

## Testing strategy

Tests cover successful root-only and nested creation, permission reuse, duplicate code/path/request entries, rollback, authorization (403 and Super Admin), ordered tree output, parent IDs, circular references, soft-delete filtering, and main-menu status cascade. Tests are written before production changes for each behavior where feasible, followed by type-check, lint, unit, and e2e/integration verification.

## Compatibility and risks

Committed migrations remain unchanged. The new migration must carefully map legacy `iam.menus` and `iam.permissions` data before adding constraints. Existing consumers of the old `code/nameTh/nameEn` entity shape will be updated in the same change or given explicit compatibility mapping. If a live database contains incompatible legacy rows, migration execution must stop with a clear error rather than silently altering data.
