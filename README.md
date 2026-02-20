# School Management System API

A RESTful API for managing schools, classrooms, and students with role-based access control (RBAC). Built with **TypeScript**, **Express**, **MongoDB (Mongoose)**, and **JWT authentication**, following the [axion](https://github.com/qantra-io/axion) boilerplate architecture.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing, rate limiting, CORS

## Setup Instructions

### Prerequisites

- Node.js >= 16
- MongoDB running locally or a remote URI
- npm

### Installation

```bash
git clone <repository-url>
cd soar
npm install
```

### Environment Variables

Copy `.env.example` or create a `.env` file in the project root:

```env
SERVICE_NAME=school-management
USER_PORT=5111
MONGO_URI=mongodb://localhost:27017/school-management
LONG_TOKEN_SECRET=your-long-token-secret
SHORT_TOKEN_SECRET=your-short-token-secret
NACL_SECRET=your-nacl-secret
```

### Running

```bash
# Development (with ts-node)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

---

## Architecture

This project follows the **axion boilerplate** architecture:

```
src/
├── config/              # Environment configuration
├── connect/             # MongoDB connection
├── libs/                # Utility functions
├── loaders/             # Auto-discovery loaders
│   ├── ManagersLoader   # Central orchestrator
│   ├── ValidatorsLoader # Schema validation
│   ├── MiddlewaresLoader# Middleware factories
│   └── MongoLoader      # Mongoose model loader
├── managers/
│   ├── api/             # HTTP API handler (routes to managers)
│   ├── entities/        # Business logic managers
│   │   ├── user/        # User registration & login
│   │   ├── school/      # School CRUD
│   │   ├── classroom/   # Classroom CRUD
│   │   └── student/     # Student CRUD + transfer
│   ├── http/            # Express server
│   ├── response_dispatcher/  # Standardized responses
│   ├── token/           # JWT token management
│   └── virtual_stack/   # Middleware execution engine
├── mws/                 # Middleware definitions
│   ├── __token.mw.ts    # JWT verification
│   ├── __superadmin.mw.ts   # Superadmin role guard
│   ├── __schoolAdmin.mw.ts  # School admin role guard
│   └── ...
└── static_arch/         # System configuration
```

### How Routing Works

All API requests go through a single Express route: `app.all('/api/:moduleName/:fnName')`.

The **ApiHandler** scans all managers for `httpExposed` arrays, builds a method matrix, and dispatches requests to the correct manager function. Middleware dependencies are auto-wired by inspecting function parameter names (parameters prefixed with `__` are treated as middleware identifiers).

---

## Authentication Flow

1. **Register** → `POST /api/user/register` → Returns a JWT `longToken`
2. **Login** → `POST /api/user/login` → Returns a JWT `longToken`
3. **Use Token** → Include `token: <longToken>` in request headers for authenticated endpoints

### Roles

| Role | Description | Access |
|------|-------------|--------|
| `superadmin` | Full system access | All CRUD on all entities |
| `school_admin` | School-specific access | CRUD limited to assigned school |

---

## API Endpoints

### Authentication

#### Register
```
POST /api/user/register
Content-Type: application/json

{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "securePassword123",
  "role": "superadmin"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": { "_id": "...", "username": "admin1", "email": "admin@example.com", "role": "superadmin" },
    "longToken": "eyJhbGci..."
  }
}
```

#### Login
```
POST /api/user/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

---

### Schools (Superadmin Only)

All school endpoints require `token` header with a superadmin JWT.

| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| POST | `/api/school/createSchool` | `{ name, address, phone?, email?, website? }` | Create school |
| GET | `/api/school/getSchool` | `?id=<schoolId>` | Get school by ID |
| GET | `/api/school/getSchools` | `?page=1&limit=20` | List all schools |
| PUT | `/api/school/updateSchool` | `{ id, name?, address?, ...}` | Update school |
| DELETE | `/api/school/deleteSchool` | `{ id }` | Delete school |

---

### Classrooms (School Admin + Superadmin)

Requires `token` header. School admins only see their school's classrooms.

| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| POST | `/api/classroom/createClassroom` | `{ name, capacity, resources?, schoolId? }` | Create classroom |
| GET | `/api/classroom/getClassroom` | `?id=<classroomId>` | Get classroom |
| GET | `/api/classroom/getClassrooms` | `?page=1&limit=20&schoolId?` | List classrooms |
| PUT | `/api/classroom/updateClassroom` | `{ id, name?, capacity?, resources? }` | Update classroom |
| DELETE | `/api/classroom/deleteClassroom` | `{ id }` | Delete classroom |

---

### Students (School Admin + Superadmin)

Requires `token` header. School admins only see their school's students.

| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| POST | `/api/student/createStudent` | `{ firstName, lastName, email?, dateOfBirth?, classroomId?, schoolId? }` | Enroll student |
| GET | `/api/student/getStudent` | `?id=<studentId>` | Get student |
| GET | `/api/student/getStudents` | `?page=1&limit=20&schoolId?&classroomId?` | List students |
| PUT | `/api/student/updateStudent` | `{ id, firstName?, lastName?, email?, ...}` | Update student |
| DELETE | `/api/student/deleteStudent` | `{ id }` | Delete student |
| PUT | `/api/student/transferStudent` | `{ studentId, newSchoolId?, newClassroomId? }` | Transfer student |

---

## Error Handling

All responses follow a consistent format:

**Success:**
```json
{ "ok": true, "data": { ... }, "errors": [], "message": "" }
```

**Error:**
```json
{ "ok": false, "data": {}, "errors": ["..."], "message": "error description" }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   School     │     │  Classroom   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ username     │     │ name         │◄────│ schoolId     │
│ email        │     │ address      │     │ name         │
│ password     │     │ phone?       │     │ capacity     │
│ role         │     │ email?       │     │ resources[]  │
│ schoolId? ───┼────►│ website?     │     │ timestamps   │
│ timestamps   │     │ timestamps   │     └──────┬───────┘
└──────────────┘     └──────────────┘            │
                                                  │
                     ┌──────────────┐              │
                     │   Student    │              │
                     ├──────────────┤              │
                     │ firstName    │              │
                     │ lastName     │              │
                     │ email?       │              │
                     │ dateOfBirth? │              │
                     │ schoolId ────┼──► School    │
                     │ classroomId? ┼──────────────┘
                     │ enrollmentDt │
                     │ timestamps   │
                     └──────────────┘
```

## Security Features

- **JWT Authentication** — stateless token-based auth
- **Password Hashing** — bcrypt with salt rounds
- **Role-Based Access** — middleware-enforced RBAC
- **School-Scoped Data** — admins can only access their assigned school
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Input Validation** — schema-based validation on all inputs
- **CORS** — configurable cross-origin settings
