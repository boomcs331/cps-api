# CPS Access Control - Project Wiki

## 1. ภาพรวมระบบ (System Overview)

CPS Access Control เป็นระบบจัดการสิทธิ์ผู้ใช้งาน (RBAC) บน NestJS + PostgreSQL รองรับการจัดการผู้ใช้ แผนก บทบาท เมนู สิทธิ์ เซสชัน และบันทึกการใช้งาน

## 2. สถาปัตยกรรม (Architecture)

### 2.1 Tech Stack
- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **ORM**: TypeORM 0.3.x
- **Database**: PostgreSQL 14+
- **Authentication**: JWT + Passport
- **Password Hashing**: Argon2
- **Documentation**: Swagger/OpenAPI
- **Schema**: `iam` (Identity and Access Management)

### 2.2 Project Structure
```
src/
├── modules/           # Feature modules (auth, users, roles, etc.)
├── entities/iam/      # TypeORM entities for 11 database tables
├── database/          # Migrations, seeds, reset scripts
├── common/            # Guards, decorators, enums, exceptions, pipes
├── main.ts            # Application bootstrap
└── app.module.ts      # Root module
```

## 3. โมเดลข้อมูล (Data Model)

### 3.1 Entities (11 tables)

| Table | คำอธิบาย | ความสัมพันธ์ |
|---|---|---|
| `actions` | การกระทำที่อนุญาต (CREATE, READ, UPDATE, DELETE) | ถูกอ้างอิงโดย `permissions` และ `role_actions` |
| `roles` | บทบาท (SUPER_ADMIN, ADMIN, USER) | มี `role_actions` และ `user_department_roles` |
| `role_actions` | ผูกบทบาทกับการกระทำ | Many-to-many ระหว่าง roles กับ actions |
| `departments` | แผนก/หน่วยงาน | ถูกอ้างอิงโดย `user_department_roles` |
| `users` | ผู้ใช้งาน | มี `user_department_roles` |
| `user_department_roles` | ผูก user กับ role และ department | Core ของระบบ RBAC |
| `user_department_permissions` | สิทธิ์เฉพาะ user | Override สิทธิ์จาก role |
| `menus` | เมนูในระบบ | มี parent-child hierarchy |
| `permissions` | ผูก menu กับ action | ถูกอ้างอิงโดย `user_department_permissions` |
| `auth_sessions` | เซสชันการเข้าสู่ระบบ | เก็บ refresh token hash |
| `audit_logs` | บันทึกการกระทำสำคัญ | ตรวจสอบย้อนหลัง |

### 3.2 ER Diagram (Textual)
```
users ──┬── user_department_roles ─── roles
        │              │
        │              └── departments
        │
        └── auth_sessions

roles ─── role_actions ─── actions
menus ─── permissions ─── actions
users ─── user_department_permissions ─── user_department_roles, permissions
```

## 4. กระบวนการเข้าสู่ระบบ (Authentication Flow)

### 4.1 Login
```
POST /auth/login
{
  "username": "superadmin",
  "password": "change-me-secure-password"
}
```

ขั้นตอน:
1. `AuthController.login()` รับ `LoginDto`
2. เรียก `AuthService.validateUser()`:
   - หา user จาก username
   - ตรวจสอบ isActive, isLocked
   - ตรวจสอบ password ด้วย argon2
   - รีเซ็ต failedLoginAttempts
3. เรียก `AuthService.login()`:
   - โหลด `user_department_roles` พร้อม department, role
   - กรอง assignments ที่ active (รวม NULL department สำหรับ superadmin)
   - ถ้าเป็น SUPER_ADMIN → generate tokens ทันที
   - ถ้ามี 1 assignment → auto-select
   - ถ้ามีหลาย assignment → คืน `requiresDepartmentSelection: true` + `departmentSelectionToken`
4. `generateTokens()`:
   - สร้าง `AuthSession`
   - sign accessToken และ refreshToken ด้วย JWT secrets
   - เก็บ refreshTokenHash ใน session

### 4.2 Department Selection
```
POST /auth/select-department
{
  "departmentSelectionToken": "...",
  "userDepartmentRoleId": "1"
}
```

ขั้นตอน:
1. `AuthController.selectDepartment()` verify `departmentSelectionToken` ด้วย `JWT_DEPARTMENT_SELECTION_SECRET`
2. ดึง `sub` (userId) จาก token
3. เรียก `AuthService.selectDepartment(userId, userDepartmentRoleId)`
4. ตรวจสอบ assignment ว่าเป็นของ user จริง และ active
5. generate tokens สำหรับ assignment นั้น

### 4.3 Switch Department
```
POST /auth/switch-department
Authorization: Bearer <accessToken>
{
  "userDepartmentRoleId": "2"
}
```

ขั้นตอน:
1. `JwtAuthGuard` verify accessToken
2. `CurrentUser` decorator ดึงข้อมูล user จาก `request.user`
3. `AuthController.switchDepartment()` ส่ง `user.id` และ `userDepartmentRoleId`
4. ทำงานเหมือน `selectDepartment`

### 4.4 Refresh Token
```
POST /auth/refresh
{
  "refreshToken": "..."
}
```

ขั้นตอน:
1. Verify refreshToken ด้วย `JWT_REFRESH_SECRET`
2. หา `AuthSession` จาก `sessionId` ในข้อมูล payload
3. ตรวจสอบ user ยัง active และไม่ locked
4. ตรวจสอบ `permissionVersion` ตรงกัน
5. Revoke session เก่า
6. generate tokens ใหม่

## 5. ระบบสิทธิ์ (Authorization / RBAC)

### 5.1 Role-Based Access Control
- **SUPER_ADMIN**: สิทธิ์ระดับระบบ ไม่ผูก department
- **ADMIN**: สิทธิ์ระดับแผนก ผูกกับ department หนึ่งแผนก
- **USER**: สิทธิ์ระดับแผนก ผูกกับ department หนึ่งแผนก

### 5.2 Permission Resolution
1. ดึง `role_actions` จาก role ของ user
2. ดึง `user_department_permissions` เพิ่มเติม/ยกเว้น
3. รวมกันเป็น set ของ permissions สำหรับ user ใน department นั้น

### 5.3 Guards
- `JwtAuthGuard`: ตรวจสอบ access token
- `Public`: อนุญาตให้เข้าถึงได้โดยไม่ต้อง login
- `@CurrentUser()`: ดึงข้อมูล user จาก JWT payload

## 6. Modules

### 6.1 AuthModule
- จัดการ login, logout, refresh, select/switch department
- ใช้ Passport Local Strategy และ JWT Strategy
- สร้างและจัดการ `AuthSession`

### 6.2 UsersModule
- CRUD ผู้ใช้งาน
- จัดการ `user_department_roles`
- รีเซ็ตรหัสผ่าน

### 6.3 DepartmentsModule
- CRUD แผนก

### 6.4 RolesModule
- CRUD บทบาท
- จัดการ `role_actions`

### 6.5 MenusModule
- CRUD เมนู
- รองรับ hierarchy (parent-child)

### 6.6 PermissionsModule
- ดูรายการสิทธิ์
- ไม่มี create/update/delete (จัดการผ่าน seeds)

### 6.7 SessionsModule
- ดูและ revoke เซสชัน

### 6.8 AuditLogsModule
- ดูบันทึกการกระทำ

## 7. Database Migration & Seeding

### 7.1 คำสั่งที่สำคัญ
```bash
pnpm db:reset        # ลบ schema iam และสร้างใหม่
pnpm migration:run   # รัน migrations
pnpm seed:run        # ใส่ข้อมูลเริ่มต้น
pnpm start:dev       # เริ่ม development server
```

### 7.2 Seed Data
- Actions: CREATE, READ, UPDATE, DELETE
- Roles: SUPER_ADMIN, ADMIN, USER
- Role Actions: SUPER_ADMIN/ADMIN ได้ทุก action, USER ได้ CREATE/READ/UPDATE
- Departments: WE, PS
- Initial Super Admin: username `superadmin` / password `change-me-secure-password`

## 8. Environment Variables

ดูรายละเอียดได้ที่ `.env.example`:
- `DB_*`: Database connection
- `JWT_*`: JWT secrets และ expiration
- `PASSWORD_HASH_ROUNDS`, `MAX_FAILED_LOGIN_ATTEMPTS`, `ACCOUNT_LOCK_MINUTES`
- `INITIAL_SUPER_ADMIN_*`: Default admin credentials

## 9. Logging

- Global HTTP logging interceptor บันทึกทุก request/response
- Debug logs ใน `AuthService.login` ช่วย trace ปัญหา department selection
- Logs ซ่อน sensitive fields (password, refreshToken)

## 10. API Testing

ไฟล์ `cps-api-collection.json` สามารถ import ใน Apidog/Postman ได้ มีตัวแปร:
- `baseUrl`
- `accessToken`
- `refreshToken`
- `departmentSelectionToken`

## 11. ข้อควรระวังใน Production

- เปลี่ยน JWT secrets ทั้งหมด
- เปลี่ยน default super admin password
- ตั้งค่า `DB_SYNCHRONIZE=false`
- ใช้ HTTPS
- ตั้งค่า CORS ให้เหมาะสม
- เก็บ logs และ audit logs อย่างปลอดภัย
