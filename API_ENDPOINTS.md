# API Endpoints - Frontend Reference

> Base URL: ตัวแปร `baseUrl` เช่น `http://localhost:3001/api/v1`
> Authorization: ส่ง `Authorization: Bearer <accessToken>` สำหรับ endpoints ที่ต้อง authentication

## Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | เข้าสู่ระบบด้วย username/password |
| POST | `/auth/select-department` | Public | เลือก department เมื่อ login ได้หลาย department |
| POST | `/auth/switch-department` | Required | เปลี่ยน department ระหว่างใช้งาน |
| POST | `/auth/refresh-token` | Public | refresh access token |
| POST | `/auth/logout` | Required | ออกจากระบบ |
| GET | `/auth/me` | Required | ดึงข้อมูลผู้ใช้ปัจจุบันพร้อม departments, roles, menus และ flat permissions |
| GET | `/auth/me/menus` | Required | ดึงเมนูของผู้ใช้ (TODO) |
| GET | `/auth/me/permissions` | Required | ดึงสิทธิ์ของผู้ใช้ (TODO) |

## Users (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Required | รายการผู้ใช้ (รองรับ `page`, `limit`) |
| GET | `/users/:id` | Required | ข้อมูลผู้ใช้ตาม id |
| POST | `/users` | Required | สร้างผู้ใช้ใหม่ |
| PATCH | `/users/:id` | Required | แก้ไขข้อมูลผู้ใช้ |
| PATCH | `/users/:id/status` | Required | อัปเดตสถานะผู้ใช้ (active/locked) |
| POST | `/users/:id/reset-password` | Required | รีเซ็ตรหัสผ่าน |
| GET | `/users/:id/assignments` | Required | ดึง assignments ของผู้ใช้ |
| POST | `/users/:id/assignments` | Required | สร้าง assignment ใหม่ |

## Departments (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/departments` | Required | รายการแผนก |
| GET | `/departments/:id` | Required | ข้อมูลแผนก |
| POST | `/departments` | Required | สร้างแผนก |
| PATCH | `/departments/:id` | Required | แก้ไขแผนก |
| DELETE | `/departments/:id` | Required | ลบแผนก |

## Roles (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/roles` | Required | รายการบทบาท |
| GET | `/roles/:id` | Required | ข้อมูลบทบาท |
| POST | `/roles` | Required | สร้างบทบาท |
| PATCH | `/roles/:id` | Required | แก้ไขบทบาท |
| DELETE | `/roles/:id` | Required | ลบบทบาท |

## Menus (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/menus` | Required | รายการเมนู |
| GET | `/menus/tree` | Required | โครงสร้างเมนูแบบ tree |
| GET | `/menus/:id` | Required | ข้อมูลเมนู |
| POST | `/menus` | Required | สร้างเมนู |
| PATCH | `/menus/:id` | Required | แก้ไขเมนู |
| DELETE | `/menus/:id` | Required | ลบเมนู |

## Permissions (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/permissions` | Required | รายการ permission |
| GET | `/permissions/:id` | Required | ข้อมูล permission |

## Sessions (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | Required | รายการเซสชัน |
| GET | `/sessions/:id` | Required | ข้อมูลเซสชัน |
| PATCH | `/sessions/:id/revoke` | Required | revoke เซสชัน |
| POST | `/sessions/revoke-all/:userId` | Required | revoke ทุกเซสชันของ user |

## Audit Logs (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/audit-logs` | Required | รายการ audit logs |
| GET | `/audit-logs/:id` | Required | ข้อมูล audit log |

## คำอธิบาย Auth

- **Public** — ไม่ต้องส่ง token
- **Required** — ต้องส่ง `Authorization: Bearer <accessToken>`
- **SUPER_ADMIN** — endpoint ที่ระบุต้องมี role `SUPER_ADMIN` เท่านั้น

## Query Parameters ทั่วไป

สำหรับ endpoints รายการที่รองรับ pagination:
- `page` — หน้าที่ต้องการ (default: 1)
- `limit` — จำนวนต่อหน้า (default: 10)
