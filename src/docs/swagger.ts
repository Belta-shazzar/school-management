/**
 * OpenAPI 3.0 specification for the School Management System API.
 *
 * Served at GET /api-docs
 *
 * Auth: All protected endpoints require a JWT passed in the `token` request header
 * (obtained from POST /api/user/login or POST /api/user/register).
 */

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'School Management System API',
    version: '1.0.0',
    description: `
A RESTful API for managing schools, classrooms, and students with
role-based access control (RBAC).

## Roles
| Role | Description |
|------|-------------|
| \`superadmin\` | Full system access — can manage all schools, classrooms, and students |
| \`school_admin\` | Scoped to their assigned school — can manage that school's classrooms and students |

## Authentication
All protected endpoints require a JWT in the **\`token\`** request header.
Obtain a token from **POST /api/user/login** or **POST /api/user/register**.

## Response Shape
Every response follows the same envelope:
\`\`\`json
{
  "ok": true | false,
  "data": {},
  "errors": [],
  "message": ""
}
\`\`\`
`,
    contact: {
      name: 'School Management System',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'User registration and login' },
    { name: 'School', description: 'School management (superadmin only)' },
    {
      name: 'Classroom',
      description: 'Classroom management (superadmin + school_admin)',
    },
    {
      name: 'Student',
      description: 'Student management (superadmin + school_admin)',
    },
  ],

  // ─── Reusable Security Scheme ──────────────────────────────────────────────
  components: {
    securitySchemes: {
      TokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'token',
        description: 'JWT long-token obtained from /api/user/login',
      },
    },

    // ─── Reusable Schemas ───────────────────────────────────────────────────
    schemas: {
      // Generic envelope
      SuccessResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: { type: 'object' },
          errors: { type: 'array', items: {} },
          message: { type: 'string', example: '' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          data: { type: 'object' },
          errors: {
            oneOf: [
              { type: 'array', items: { type: 'string' } },
              { type: 'string' },
            ],
          },
          message: { type: 'string' },
        },
      },

      // ─── User ─────────────────────────────────────────────────────────────
      UserRegisterBody: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
            example: 'johndoe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'Str0ng!Pass',
          },
          role: {
            type: 'string',
            enum: ['superadmin', 'school_admin'],
            default: 'school_admin',
            description: 'Defaults to school_admin if omitted or invalid',
          },
        },
      },
      UserLoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com',
          },
          password: {
            type: 'string',
            example: 'Str0ng!Pass',
          },
        },
      },
      UserObject: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
          username: { type: 'string', example: 'johndoe' },
          email: { type: 'string', example: 'john@example.com' },
          role: {
            type: 'string',
            enum: ['superadmin', 'school_admin'],
          },
          schoolId: {
            type: 'string',
            nullable: true,
            example: '64f1a2b3c4d5e6f7a8b9c0d2',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/UserObject' },
          longToken: {
            type: 'string',
            description: 'JWT token — pass this as the `token` header in future requests',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },

      // ─── School ───────────────────────────────────────────────────────────
      SchoolCreateBody: {
        type: 'object',
        required: ['name', 'address'],
        properties: {
          name: { type: 'string', example: 'Springfield Elementary' },
          address: { type: 'string', example: '742 Evergreen Terrace, Springfield' },
          phone: { type: 'string', example: '+1-555-0100' },
          email: { type: 'string', format: 'email', example: 'info@springfield.edu' },
          website: { type: 'string', example: 'https://springfield.edu' },
        },
      },
      SchoolUpdateBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'School MongoDB _id',
            example: '64f1a2b3c4d5e6f7a8b9c0d2',
          },
          name: { type: 'string', example: 'Springfield Elementary (Revised)' },
          address: { type: 'string', example: '742 Evergreen Terrace' },
          phone: { type: 'string', example: '+1-555-0101' },
          email: { type: 'string', format: 'email', example: 'new@springfield.edu' },
          website: { type: 'string', example: 'https://springfield-new.edu' },
        },
      },
      SchoolDeleteBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
        },
      },
      SchoolObject: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
          name: { type: 'string', example: 'Springfield Elementary' },
          address: { type: 'string', example: '742 Evergreen Terrace' },
          phone: { type: 'string', example: '+1-555-0100' },
          email: { type: 'string', example: 'info@springfield.edu' },
          website: { type: 'string', example: 'https://springfield.edu' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Classroom ────────────────────────────────────────────────────────
      ClassroomCreateBody: {
        type: 'object',
        required: ['name', 'capacity'],
        properties: {
          name: { type: 'string', example: 'Class 3B' },
          capacity: { type: 'integer', minimum: 1, example: 30 },
          resources: {
            type: 'array',
            items: { type: 'string' },
            example: ['projector', 'whiteboard'],
          },
          schoolId: {
            type: 'string',
            description: 'Required for superadmin. school_admin uses their assigned school.',
            example: '64f1a2b3c4d5e6f7a8b9c0d2',
          },
        },
      },
      ClassroomUpdateBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
          name: { type: 'string', example: 'Class 3B (Updated)' },
          capacity: { type: 'integer', example: 35 },
          resources: {
            type: 'array',
            items: { type: 'string' },
            example: ['projector', 'smartboard'],
          },
        },
      },
      ClassroomDeleteBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
        },
      },
      ClassroomObject: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
          name: { type: 'string', example: 'Class 3B' },
          schoolId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
          capacity: { type: 'integer', example: 30 },
          resources: {
            type: 'array',
            items: { type: 'string' },
            example: ['projector'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Student ──────────────────────────────────────────────────────────
      StudentCreateBody: {
        type: 'object',
        required: ['firstName', 'lastName'],
        properties: {
          firstName: { type: 'string', example: 'Alice' },
          lastName: { type: 'string', example: 'Smith' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            example: '2010-04-15',
          },
          classroomId: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7a8b9c0d3',
          },
          schoolId: {
            type: 'string',
            description: 'Required for superadmin. school_admin uses their assigned school.',
            example: '64f1a2b3c4d5e6f7a8b9c0d2',
          },
        },
      },
      StudentUpdateBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d4' },
          firstName: { type: 'string', example: 'Alice' },
          lastName: { type: 'string', example: 'Johnson' },
          email: { type: 'string', format: 'email', example: 'alice.j@example.com' },
          dateOfBirth: { type: 'string', format: 'date', example: '2010-04-15' },
          classroomId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
        },
      },
      StudentDeleteBody: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d4' },
        },
      },
      StudentTransferBody: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d4' },
          newSchoolId: {
            type: 'string',
            description: 'Only superadmin can transfer to a different school',
            example: '64f1a2b3c4d5e6f7a8b9c0d5',
          },
          newClassroomId: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7a8b9c0d6',
          },
        },
      },
      StudentObject: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d4' },
          firstName: { type: 'string', example: 'Alice' },
          lastName: { type: 'string', example: 'Smith' },
          email: { type: 'string', example: 'alice@example.com' },
          dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
          schoolId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
          classroomId: {
            type: 'string',
            nullable: true,
            example: '64f1a2b3c4d5e6f7a8b9c0d3',
          },
          enrollmentDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Paginated wrappers ───────────────────────────────────────────────
      PaginatedSchools: {
        type: 'object',
        properties: {
          schools: {
            type: 'array',
            items: { $ref: '#/components/schemas/SchoolObject' },
          },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
      PaginatedClassrooms: {
        type: 'object',
        properties: {
          classrooms: {
            type: 'array',
            items: { $ref: '#/components/schemas/ClassroomObject' },
          },
          total: { type: 'integer', example: 10 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
      PaginatedStudents: {
        type: 'object',
        properties: {
          students: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudentObject' },
          },
          total: { type: 'integer', example: 150 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
    },

    // ─── Reusable Responses ─────────────────────────────────────────────────
    responses: {
      Unauthorized: {
        description: 'Missing or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { ok: false, data: {}, errors: 'unauthorized', message: '' },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient role',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              ok: false,
              data: {},
              errors: [],
              message: 'Forbidden: superadmin access required',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { ok: false, data: {}, errors: [], message: 'Resource not found' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              ok: false,
              data: {},
              errors: ['name is required', 'capacity must be a number'],
              message: '',
            },
          },
        },
      },
    },

    // ─── Reusable Parameters ────────────────────────────────────────────────
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1, minimum: 1 },
        description: 'Page number (1-based)',
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
        description: 'Results per page',
      },
    },
  },

  // ─── Paths ──────────────────────────────────────────────────────────────────
  paths: {
    // ──────────────────── AUTH ────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description:
          'Creates a new user account. Returns a JWT `longToken` (3-year expiry) for immediate use.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/AuthResponse' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns a JWT `longToken`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/AuthResponse' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  ok: false,
                  data: {},
                  errors: [],
                  message: 'Invalid email or password',
                },
              },
            },
          },
        },
      },
    },

    // ──────────────────── SCHOOL ──────────────────────────────────────────────
    '/api/school/createSchool': {
      post: {
        tags: ['School'],
        summary: 'Create a new school',
        security: [{ TokenAuth: [] }],
        description: '**Requires: superadmin**',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SchoolCreateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'School created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/SchoolObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/school/getSchool': {
      get: {
        tags: ['School'],
        summary: 'Get a school by ID',
        security: [{ TokenAuth: [] }],
        description: '**Requires: superadmin**',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'School MongoDB _id',
            example: '64f1a2b3c4d5e6f7a8b9c0d2',
          },
        ],
        responses: {
          '200': {
            description: 'School document',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/SchoolObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/school/getSchools': {
      get: {
        tags: ['School'],
        summary: 'List all schools (paginated)',
        security: [{ TokenAuth: [] }],
        description: '**Requires: superadmin**',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
        ],
        responses: {
          '200': {
            description: 'Paginated school list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/PaginatedSchools' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/school/updateSchool': {
      put: {
        tags: ['School'],
        summary: 'Update a school',
        security: [{ TokenAuth: [] }],
        description: '**Requires: superadmin**. Only provided fields are updated.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SchoolUpdateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated school document',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/SchoolObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/school/deleteSchool': {
      delete: {
        tags: ['School'],
        summary: 'Delete a school',
        security: [{ TokenAuth: [] }],
        description: '**Requires: superadmin**',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SchoolDeleteBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'School deleted',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string',
                              example: 'School deleted successfully',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ──────────────────── CLASSROOM ───────────────────────────────────────────
    '/api/classroom/createClassroom': {
      post: {
        tags: ['Classroom'],
        summary: 'Create a new classroom',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '- `school_admin` — classroom is automatically scoped to their school.\n' +
          '- `superadmin` — must provide `schoolId` in the request body.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClassroomCreateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Classroom created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ClassroomObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/classroom/getClassroom': {
      get: {
        tags: ['Classroom'],
        summary: 'Get a classroom by ID',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only view classrooms in their own school.',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Classroom MongoDB _id',
          },
        ],
        responses: {
          '200': {
            description: 'Classroom document (with populated school)',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ClassroomObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/classroom/getClassrooms': {
      get: {
        tags: ['Classroom'],
        summary: 'List classrooms (paginated)',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '- `school_admin` — only sees their school\'s classrooms.\n' +
          '- `superadmin` — can filter by `schoolId` or view all.',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'schoolId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by school (superadmin only)',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated classroom list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/PaginatedClassrooms' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/classroom/updateClassroom': {
      put: {
        tags: ['Classroom'],
        summary: 'Update a classroom',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only update classrooms in their own school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClassroomUpdateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated classroom document',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ClassroomObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/classroom/deleteClassroom': {
      delete: {
        tags: ['Classroom'],
        summary: 'Delete a classroom',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only delete classrooms in their own school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClassroomDeleteBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Classroom deleted',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string',
                              example: 'Classroom deleted successfully',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ──────────────────── STUDENT ─────────────────────────────────────────────
    '/api/student/createStudent': {
      post: {
        tags: ['Student'],
        summary: 'Enroll a new student',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '- `school_admin` — student is automatically assigned to their school.\n' +
          '- `superadmin` — must provide `schoolId`.\n' +
          'If `classroomId` is provided, it must belong to the resolved school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StudentCreateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Student enrolled',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/StudentObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/student/getStudent': {
      get: {
        tags: ['Student'],
        summary: 'Get a student by ID',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only view students in their own school.',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Student MongoDB _id',
          },
        ],
        responses: {
          '200': {
            description: 'Student document (with populated school and classroom)',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/StudentObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/student/getStudents': {
      get: {
        tags: ['Student'],
        summary: 'List students (paginated)',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '- `school_admin` — only sees their school\'s students.\n' +
          '- `superadmin` — can filter by `schoolId` and/or `classroomId`.',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'schoolId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by school (superadmin only)',
          },
          {
            name: 'classroomId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by classroom',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated student list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/PaginatedStudents' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/student/updateStudent': {
      put: {
        tags: ['Student'],
        summary: "Update a student's profile",
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only update students in their own school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StudentUpdateBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated student document',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/StudentObject' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/student/deleteStudent': {
      delete: {
        tags: ['Student'],
        summary: 'Delete (unenroll) a student',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '`school_admin` can only delete students in their own school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StudentDeleteBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Student deleted',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string',
                              example: 'Student deleted successfully',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/student/transferStudent': {
      put: {
        tags: ['Student'],
        summary: 'Transfer a student to another school/classroom',
        security: [{ TokenAuth: [] }],
        description:
          '**Requires: school_admin or superadmin**.\n\n' +
          '- `school_admin` — can reassign a student to a different classroom **within their school only**.\n' +
          '- `superadmin` — can transfer to a completely different school and classroom.\n\n' +
          'At least one of `newSchoolId` or `newClassroomId` must be provided.\n' +
          'If `newClassroomId` is given, it must belong to the target school.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StudentTransferBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Student transferred',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string',
                              example: 'Student transferred successfully',
                            },
                            student: { $ref: '#/components/schemas/StudentObject' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

export default swaggerDocument;
