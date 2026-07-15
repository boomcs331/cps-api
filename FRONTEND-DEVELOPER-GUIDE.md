# Frontend Developer Guide - Full API Integration

เอกสารฉบับนี้รวบรวมวิธี integrate กับ API ทั้งหมดของ CPS Access Control สำหรับ Frontend Developer

## 1. สิ่งที่ต้องรู้ก่อน

- Base URL: `{baseUrl}` (เช่น `http://localhost:3001`)
- Authentication: JWT Bearer Token
- Role `SUPER_ADMIN` ถึงจะจัดการ Users, Departments, Roles, Menus, Sessions, Audit Logs ได้
- ทุก request ที่ต้องการ Auth ต้องใส่ Header: `Authorization: Bearer <accessToken>`

## 2. Auth Flow ทั้งหมด

### 2.1 Login
```http
POST {baseUrl}/auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "change-me-secure-password"
}
```

**กรณี A: ได้ token ทันที (superadmin หรือมี 1 assignment)**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "1",
    "username": "superadmin",
    "email": "superadmin@example.com",
    "firstName": "System",
    "lastName": "Administrator"
  },
  "activeDepartment": null,
  "role": { "code": "SUPER_ADMIN", "name": "..." }
}
```

**กรณี B: ต้องเลือก department (มีหลาย assignment)**
```json
{
  "requiresDepartmentSelection": true,
  "departmentSelectionToken": "eyJ...",
  "departments": [
    {
      "userDepartmentRoleId": "2",
      "departmentId": "1",
      "departmentCode": "WE",
      "departmentName": "แผนก WE",
      "roleCode": "ADMIN"
    }
  ]
}
```

### 2.2 Select Department
```http
POST {baseUrl}/auth/select-department
Content-Type: application/json

{
  "departmentSelectionToken": "<from_login>",
  "userDepartmentRoleId": "2"
}
```

Response เหมือนกรณี A

### 2.3 Switch Department
```http
POST {baseUrl}/auth/switch-department
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "userDepartmentRoleId": "3"
}
```

### 2.4 Refresh Token
```http
POST {baseUrl}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### 2.5 Logout
```http
POST {baseUrl}/auth/logout
Authorization: Bearer <accessToken>
```

## 3. TypeScript Types

```typescript
interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  requiresDepartmentSelection?: boolean;
  departmentSelectionToken?: string;
  departments?: DepartmentOption[];
  user?: User;
  activeDepartment?: Department | null;
  role?: RoleInfo;
}

interface DepartmentOption {
  userDepartmentRoleId: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  roleCode: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Department {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

interface RoleInfo {
  code: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## 4. HTTP Client Helper

```typescript
const BASE_URL = 'http://localhost:3001';

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // token หมดอายุ หรือไม่ valid
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    // retry
    return api(path, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
```

## 5. Auth Module Functions

```typescript
export async function login(username: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function selectDepartment(
  token: string,
  userDepartmentRoleId: string
): Promise<LoginResponse> {
  return api<LoginResponse>('/auth/select-department', {
    method: 'POST',
    body: JSON.stringify({ departmentSelectionToken: token, userDepartmentRoleId }),
  });
}

export async function switchDepartment(userDepartmentRoleId: string): Promise<LoginResponse> {
  return api<LoginResponse>('/auth/switch-department', {
    method: 'POST',
    body: JSON.stringify({ userDepartmentRoleId }),
  });
}

export async function getMe(): Promise<User> {
  return api<User>('/auth/me');
}

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

## 6. Users Module

### 6.1 List Users
```typescript
export async function listUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
  return api<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`);
}
```

### 6.2 Create User
```typescript
interface CreateUserPayload {
  username: string;
  password: string; // min 6
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  assignments: {
    departmentId: string;
    roleId: string;
    permissionIds?: string[];
  }[];
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return api<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

Example:
```json
{
  "username": "we.admin",
  "password": "password123",
  "firstName": "WE",
  "lastName": "Admin",
  "email": "we.admin@example.com",
  "assignments": [
    { "departmentId": "1", "roleId": "2" }
  ]
}
```

### 6.3 Update User
```typescript
interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return api<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
```

### 6.4 Update Status
```typescript
export async function updateUserStatus(id: string, isActive: boolean): Promise<User> {
  return api<User>(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}
```

### 6.5 Reset Password
```typescript
export async function resetPassword(id: string, newPassword: string): Promise<void> {
  return api(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}
```

### 6.6 Get User Assignments
```typescript
export async function getUserAssignments(id: string): Promise<any[]> {
  return api<any[]>(`/users/${id}/assignments`);
}
```

### 6.7 Create Assignment
```typescript
export async function createUserAssignment(
  id: string,
  payload: CreateUserPayload['assignments'][0]
): Promise<any> {
  return api<any>(`/users/${id}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

## 7. Departments Module

### 7.1 DTOs
```typescript
interface CreateDepartmentPayload {
  code: string;
  nameTh: string;
  nameEn: string;
  description?: string;
}

interface UpdateDepartmentPayload {
  nameTh?: string;
  nameEn?: string;
  description?: string;
}
```

### 7.2 Functions
```typescript
export const departmentApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<Department>>(`/departments?page=${page}&limit=${limit}`),
  get: (id: string) => api<Department>(`/departments/${id}`),
  create: (payload: CreateDepartmentPayload) =>
    api<Department>('/departments', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateDepartmentPayload) =>
    api<Department>(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => api(`/departments/${id}`, { method: 'DELETE' }),
};
```

## 8. Roles Module

### 8.1 DTOs
```typescript
enum ScopeType {
  SYSTEM = 'SYSTEM',
  DEPARTMENT = 'DEPARTMENT',
}

interface CreateRolePayload {
  code: string;
  nameTh: string;
  nameEn: string;
  scopeType?: ScopeType;
  description?: string;
}

interface UpdateRolePayload {
  nameTh?: string;
  nameEn?: string;
  scopeType?: ScopeType;
  description?: string;
}
```

### 8.2 Functions
```typescript
export const roleApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<any>>(`/roles?page=${page}&limit=${limit}`),
  get: (id: string) => api<any>(`/roles/${id}`),
  create: (payload: CreateRolePayload) =>
    api<any>('/roles', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateRolePayload) =>
    api<any>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => api(`/roles/${id}`, { method: 'DELETE' }),
};
```

## 9. Menus Module

### 9.1 DTOs
```typescript
enum MenuType {
  MENU = 'MENU',
  BUTTON = 'BUTTON',
}

interface CreateMenuPayload {
  parentId?: string;
  code: string;
  nameTh: string;
  nameEn: string;
  menuType?: MenuType;
  path?: string;
  icon?: string;
  sortOrder?: number;
}

interface UpdateMenuPayload {
  parentId?: string;
  nameTh?: string;
  nameEn?: string;
  menuType?: MenuType;
  path?: string;
  icon?: string;
  sortOrder?: number;
}
```

### 9.2 Functions
```typescript
export const menuApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<any>>(`/menus?page=${page}&limit=${limit}`),
  tree: () => api<any>('/menus/tree'),
  get: (id: string) => api<any>(`/menus/${id}`),
  create: (payload: CreateMenuPayload) =>
    api<any>('/menus', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateMenuPayload) =>
    api<any>(`/menus/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => api(`/menus/${id}`, { method: 'DELETE' }),
};
```

## 10. Permissions Module

```typescript
export const permissionApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<any>>(`/permissions?page=${page}&limit=${limit}`),
  get: (id: string) => api<any>(`/permissions/${id}`),
};
```

## 11. Sessions Module

```typescript
export const sessionApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<any>>(`/sessions?page=${page}&limit=${limit}`),
  get: (id: string) => api<any>(`/sessions/${id}`),
  revoke: (id: string) => api(`/sessions/${id}/revoke`, { method: 'PATCH' }),
  revokeAll: (userId: string) =>
    api(`/sessions/revoke-all/${userId}`, { method: 'POST' }),
};
```

## 12. Audit Logs Module

```typescript
export const auditLogApi = {
  list: (page = 1, limit = 10) =>
    api<PaginatedResponse<any>>(`/audit-logs?page=${page}&limit=${limit}`),
  get: (id: string) => api<any>(`/audit-logs/${id}`),
};
```

## 13. React Hook Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe().then(setUser).catch(() => logout());
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const res = await login(username, password);

    if (res.requiresDepartmentSelection) {
      // redirect to department selection page
      return { step: 'select-department', ...res };
    }

    localStorage.setItem('accessToken', res.accessToken!);
    localStorage.setItem('refreshToken', res.refreshToken!);
    setUser(res.user!);
    return { step: 'logged-in' };
  };

  const handleSelectDepartment = async (token: string, udrId: string) => {
    const res = await selectDepartment(token, udrId);
    localStorage.setItem('accessToken', res.accessToken!);
    localStorage.setItem('refreshToken', res.refreshToken!);
    setUser(res.user!);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return { user, handleLogin, handleSelectDepartment, handleLogout };
}
```

## 14. Error Handling

```typescript
async function handleApiError(error: any) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
  } else if (error.message.includes('403')) {
    // Forbidden - show access denied
  } else if (error.message.includes('400')) {
    // Validation error - show field errors
  } else {
    // Generic error
  }
}
```

## 15. Security Checklist

- [ ] อย่าเก็บ tokens ใน localStorage ถ้าเป็นไปได้ — ใช้ httpOnly cookies
- [ ] ตั้ง timer refresh token ก่อนหมดอายุ
- [ ] ล้าง tokens เมื่อ logout
- [ ] ใช้ HTTPS ทุกครั้งใน production
- [ ] ไม่แสดง sensitive error ให้ user เห็น
- [ ] Validate ข้อมูลฝั่ง frontend ก่อนส่ง (required, minLength, email format)
