# Access Control System - Implementation Plan

## Phase 1: Foundation Setup
**Priority: HIGH**

### 1.1 Add Missing Dependencies
- @nestjs/jwt
- @nestjs/passport
- passport
- passport-jwt
- passport-local
- @types/passport-jwt
- @types/passport-local
- argon2
- class-validator
- class-transformer
- @nestjs/swagger
- swagger-ui-express

### 1.2 Update Configuration
- Update .env.example with all required variables
- Update app.module.ts:
  - Set synchronize: false
  - Add schema: iam
  - Add ValidationPipe configuration
  - Add Swagger configuration
- Update main.ts with Swagger setup

### 1.3 Create Common Module Structure
```
src/common/
├── decorators/
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   ├── require-permissions.decorator.ts
│   ├── current-user.decorator.ts
│   ├── current-department.decorator.ts
│   └── current-assignment.decorator.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── active-user.guard.ts
│   ├── active-assignment.guard.ts
│   ├── roles.guard.ts
│   └── permission.guard.ts
├── interfaces/
│   ├── jwt-payload.interface.ts
│   └── current-user.interface.ts
├── enums/
│   ├── role-code.enum.ts
│   ├── scope-type.enum.ts
│   ├── menu-type.enum.ts
│   ├── action-code.enum.ts
│   └── error-code.enum.ts
├── exceptions/
│   └── custom-exceptions.ts
├── constants/
│   └── constants.ts
└── pipes/
    └── validation.pipe.ts
```

## Phase 2: Database Layer
**Priority: HIGH**

### 2.1 Create TypeORM Entities (Schema: iam)
All entities will use:
- BIGINT GENERATED ALWAYS AS IDENTITY for primary keys
- Schema: iam
- Proper column types and constraints

**Entities to create:**
1. iam.users
2. iam.roles
3. iam.departments
4. iam.actions
5. iam.user_department_roles
6. iam.menus
7. iam.permissions
8. iam.role_actions
9. iam.user_department_permissions
10. iam.auth_sessions
11. iam.audit_logs

### 2.2 Create TypeORM Migrations
- Initial migration for all 11 tables
- Use raw SQL for schema creation and constraints

### 2.3 Create Seed Scripts
- Seed roles (SUPER_ADMIN, ADMIN, USER)
- Seed actions (CREATE, READ, UPDATE, DELETE)
- Seed role_actions
- Seed departments (WE, PS)
- Seed initial super admin from environment variables

## Phase 3: Authentication Module
**Priority: HIGH**

### 3.1 Auth Module Structure
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── local.strategy.ts
│   └── jwt-refresh.strategy.ts
├── dto/
│   ├── login.dto.ts
│   ├── select-department.dto.ts
│   ├── switch-department.dto.ts
│   └── refresh-token.dto.ts
└── guards/
    └── jwt-auth.guard.ts
```

### 3.2 Auth Endpoints
- POST /auth/login
- POST /auth/select-department
- POST /auth/switch-department
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- GET /auth/me/menus
- GET /auth/me/permissions

## Phase 4: Users Module
**Priority: HIGH**

### 4.1 Users Module Structure
```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── create-assignment.dto.ts
│   └── update-assignment.dto.ts
└── entities/
    └── user.entity.ts (will use iam.users)
```

### 4.2 Users Endpoints
- GET /users
- GET /users/:id
- POST /users
- PATCH /users/:id
- PATCH /users/:id/status
- POST /users/:id/reset-password
- GET /users/:id/assignments
- POST /users/:id/assignments
- PATCH /users/:id/assignments/:assignmentId
- DELETE /users/:id/assignments/:assignmentId
- GET /users/:id/assignments/:assignmentId/permissions
- PUT /users/:id/assignments/:assignmentId/permissions

## Phase 5: Departments Module
**Priority: MEDIUM**

### 5.1 Departments Module Structure
```
src/modules/departments/
├── departments.module.ts
├── departments.controller.ts
├── departments.service.ts
└── dto/
    ├── create-department.dto.ts
    └── update-department.dto.ts
```

### 5.2 Departments Endpoints
- GET /departments
- GET /departments/:id
- POST /departments
- PATCH /departments/:id
- PATCH /departments/:id/status

## Phase 6: Roles Module
**Priority: MEDIUM**

### 6.1 Roles Module Structure
```
src/modules/roles/
├── roles.module.ts
├── roles.controller.ts
├── roles.service.ts
└── dto/
    └── role.dto.ts
```

### 6.2 Roles Endpoints
- GET /roles
- GET /roles/:id
- GET /roles/:id/actions

## Phase 7: Menus Module
**Priority: MEDIUM**

### 7.1 Menus Module Structure
```
src/modules/menus/
├── menus.module.ts
├── menus.controller.ts
├── menus.service.ts
└── dto/
    ├── create-menu.dto.ts
    └── update-menu.dto.ts
```

### 7.2 Menus Endpoints
- GET /menus
- GET /menus/tree
- GET /menus/:id
- POST /menus
- PATCH /menus/:id
- PATCH /menus/:id/status
- PATCH /menus/reorder

## Phase 8: Permissions Module
**Priority: MEDIUM**

### 8.1 Permissions Module Structure
```
src/modules/permissions/
├── permissions.module.ts
├── permissions.controller.ts
├── permissions.service.ts
└── dto/
    └── permission.dto.ts
```

### 8.2 Permissions Endpoints
- GET /permissions
- GET /permissions?menuId=1
- GET /permissions/:id

## Phase 9: Sessions Module
**Priority: MEDIUM**

### 9.1 Sessions Module Structure
```
src/modules/sessions/
├── sessions.module.ts
├── sessions.service.ts
└── dto/
    └── session.dto.ts
```

## Phase 10: Audit Logs Module
**Priority: MEDIUM**

### 10.1 Audit Logs Module Structure
```
src/modules/audit-logs/
├── audit-logs.module.ts
├── audit-logs.controller.ts
├── audit-logs.service.ts
└── dto/
    └── audit-log.dto.ts
```

## Phase 11: Testing
**Priority: MEDIUM**

### 11.1 Unit Tests
- Auth service tests
- User service tests
- Guard tests
- Permission evaluation tests

### 11.2 Integration Tests
- Authentication flow tests
- Authorization tests
- Department scope tests
- User management tests

## Phase 12: Documentation
**Priority: MEDIUM**

### 12.1 Documentation
- Update README.md with setup instructions
- Add Swagger documentation to all endpoints
- Create API documentation examples

## File Structure Summary

```
src/
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interfaces/
│   ├── enums/
│   ├── exceptions/
│   ├── constants/
│   └── pipes/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── departments/
│   ├── roles/
│   ├── menus/
│   ├── permissions/
│   ├── sessions/
│   └── audit-logs/
├── database/
│   ├── migrations/
│   └── seeds/
├── entities/
│   └── (will be moved to modules)
├── app.module.ts
└── main.ts
```

## Implementation Order

1. Phase 1: Foundation Setup
2. Phase 2: Database Layer (Entities → Migrations → Seeds)
3. Phase 3: Authentication Module
4. Phase 8: Common Module (Guards, Decorators)
5. Phase 4: Users Module
6. Phase 5: Departments Module
7. Phase 6: Roles Module
8. Phase 7: Menus Module
9. Phase 9: Sessions Module
10. Phase 10: Audit Logs Module
11. Phase 11: Testing
12. Phase 12: Documentation

## Key Constraints to Remember

- No UUID - use BIGINT GENERATED ALWAYS AS IDENTITY
- Schema: iam for all access control tables
- synchronize: false
- Password and refresh token must be hashed
- Department scope must come from JWT/server-side, not frontend
- SUPER_ADMIN bypass permission checks
- Permission version tracking
- Audit logging for sensitive operations
- Transaction for multi-table operations
