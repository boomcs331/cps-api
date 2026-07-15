# Frontend Integration Guide - CPS Access Control API

## 1. ภาพรวมการเข้าสู่ระบบ

Frontend ต้องรองรับ 2 กรณีหลังจาก login:

1. **Login สำเร็จทันที** — ได้ `accessToken` + `refreshToken`
2. **ต้องเลือก department** — ได้ `requiresDepartmentSelection: true` + `departmentSelectionToken` + `departments[]`

## 2. Flow การ Login

### 2.1 เรียก Login API

```http
POST {baseUrl}/auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "change-me-secure-password"
}
```

### 2.2 กรณีที่ 1: Login สำเร็จทันที

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "superadmin",
    "email": "superadmin@example.com",
    "firstName": "System",
    "lastName": "Administrator"
  },
  "activeDepartment": null,
  "role": {
    "code": "SUPER_ADMIN",
    "name": "ผู้ดูแลระบบสูงสุด"
  }
}
```

**Frontend ต้องทำ:**
1. เก็บ `accessToken` และ `refreshToken` อย่างปลอดภัย (เช่น httpOnly cookie หรือ memory store)
2. redirect ไปหน้า Dashboard
3. ใช้ `accessToken` ใน Header `Authorization: Bearer <accessToken>` สำหรับทุก API ถัดไป

### 2.3 กรณีที่ 2: ต้องเลือก Department

```json
{
  "requiresDepartmentSelection": true,
  "departmentSelectionToken": "eyJhbGciOiJIUzI1NiIs...",
  "departments": [
    {
      "userDepartmentRoleId": "2",
      "departmentId": "1",
      "departmentCode": "WE",
      "departmentName": "แผนก WE",
      "roleCode": "ADMIN"
    },
    {
      "userDepartmentRoleId": "3",
      "departmentId": "2",
      "departmentCode": "PS",
      "departmentName": "แผนก PS",
      "roleCode": "USER"
    }
  ]
}
```

**Frontend ต้องทำ:**
1. แสดง UI ให้ผู้ใช้เลือก department
2. เก็บ `departmentSelectionToken` ไว้ชั่วคราว
3. เมื่อผู้ใช้เลือก department ให้เรียก `/auth/select-department`

## 3. Select Department

```http
POST {baseUrl}/auth/select-department
Content-Type: application/json

{
  "departmentSelectionToken": "eyJhbGciOiJIUzI1NiIs...",
  "userDepartmentRoleId": "2"
}
```

**Response สำเร็จ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "activeDepartment": {
    "id": "1",
    "code": "WE",
    "nameTh": "แผนก WE"
  },
  "role": {
    "code": "ADMIN",
    "name": "ผู้ดูแลระบบ"
  }
}
```

## 4. Switch Department (ต้อง login แล้ว)

```http
POST {baseUrl}/auth/switch-department
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "userDepartmentRoleId": "3"
}
```

**Response สำเร็จ:** เหมือน select-department — ได้ token ชุดใหม่

## 5. Refresh Token

เมื่อ `accessToken` หมดอายุ (default 15 นาที) ให้เรียก:

```http
POST {baseUrl}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response สำเร็จ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 6. เรียก API ทั่วไป

ทุก request ที่ต้องการ authentication ต้องใส่ Header:

```http
GET {baseUrl}/users
Authorization: Bearer <accessToken>
```

## 7. ตัวอย่างโค้ด React / TypeScript

```typescript
interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  requiresDepartmentSelection?: boolean;
  departmentSelectionToken?: string;
  departments?: Array<{
    userDepartmentRoleId: string;
    departmentId: string | null;
    departmentCode: string | null;
    departmentName: string | null;
    roleCode: string;
  }>;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  activeDepartment?: any;
  role?: { code: string; name: string };
}

async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  const data: LoginResponse = await res.json();

  if (data.requiresDepartmentSelection) {
    // แสดง UI เลือก department
    return {
      step: 'select-department',
      departmentSelectionToken: data.departmentSelectionToken,
      departments: data.departments,
    };
  }

  // Login สำเร็จทันที
  localStorage.setItem('accessToken', data.accessToken!);
  localStorage.setItem('refreshToken', data.refreshToken!);
  return { step: 'logged-in', user: data.user };
}

async function selectDepartment(departmentSelectionToken: string, userDepartmentRoleId: string) {
  const res = await fetch(`${BASE_URL}/auth/select-department`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentSelectionToken, userDepartmentRoleId }),
  });

  if (!res.ok) {
    throw new Error('Department selection failed');
  }

  const data = await res.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    // Token หมดอายุ หรือไม่ถูกต้อง
    // TODO: เรียก refresh token หรือ redirect ไป login
  }

  return res;
}
```

## 8. การจัดการ Error ที่พบบ่อย

| HTTP Status | สาเหตุ | การแก้ไข |
|---|---|---|
| 400 Bad Request | Validation error (เช่น ขาด field) | ตรวจสอบ request body |
| 401 Unauthorized | รหัสผ่านผิด / token หมดอายุ | แสดงข้อความผิดพลาด หรือ refresh token |
| 403 Forbidden | ไม่มีสิทธิ์ | แสดงข้อความ access denied |
| 422 Unprocessable | Custom exception (user locked, inactive) | แสดง error code ที่ backend ส่งมา |

## 9. ข้อควรระวังด้านความปลอดภัย

1. **อย่าเก็บ tokens ใน localStorage** ถ้าเป็นไปได้ — ใช้ httpOnly cookies
2. ตั้งเวลา refresh token ก่อนหมดอายุ
3. ล้าง tokens เมื่อ logout
4. ใช้ HTTPS ทุกครั้งใน production
5. แสดงข้อความผิดพลาดกลางๆ สำหรับ login failed (ป้องกัน username enumeration)
## Login access control response

ใช้ `data.accessControl.permissions` เป็นรายการ permission แบบ flat และใช้ `data.accessControl.menus` สร้าง sidebar จาก `children` ที่เรียงตาม `sortOrder` แล้ว

ตรวจสิทธิ์ด้วย `permission.code` เช่น `user.create` และตรวจ route ด้วย `menu.code`/`menu.path` ห้ามใช้ชื่อเมนูเป็น key การอนุญาต ระบบ backend ยังตรวจ permission ซ้ำทุก protected endpoint เสมอ
