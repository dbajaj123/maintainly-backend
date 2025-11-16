# Maintainly Backend

**A professional property maintenance management API built with Node.js, Express.js, MongoDB, and Supabase Storage.**

This README serves as both an onboarding guide for backend engineers and comprehensive API documentation for the Maintainly platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Supabase project (for storage)

### Installation

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# 4. Start development server
npm run dev

# 5. Verify installation
# Visit http://localhost:3000/health
```

### Default Admin Account
On first startup, a default admin is created:
- **Email**: `admin@maintainly.com`
- **Password**: `admin123`
- ⚠️ **Change immediately after first login**

---

## 🏗️ Architecture Overview

**Type**: Monolithic Express.js REST API

**Tech Stack**:
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Storage**: Supabase Storage (verification photos)
- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: Role-based access control (Admin/Manager)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs password hashing

**Core Responsibilities**:
- User authentication & authorization
- Society (property) management
- Asset library & asset management
- Maintenance task lifecycle
- Photo verification workflow
- Signed URL generation for uploads

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js              # MongoDB connection & configuration
├── controllers/
│   ├── authController.js        # Authentication & user management
│   ├── societiesController.js   # Society CRUD operations
│   ├── assetLibraryController.js # Asset library management
│   ├── assetsController.js      # Asset CRUD operations
│   ├── tasksController.js       # Task management & verification
│   ├── dashboardController.js   # Dashboard statistics
│   ├── issuesController.js      # Issue tracking
│   ├── managersController.js    # Manager operations
│   └── adminLinksController.js  # Admin link management
├── middleware/
│   ├── authMiddleware.js        # JWT authentication
│   ├── roleMiddleware.js        # Role-based authorization
│   ├── errorHandler.js          # Global error handling
│   ├── cache.js                 # Caching middleware
│   └── speedInsights.js         # Performance monitoring
├── models/
│   ├── User.js                  # User model (Admin/Manager roles)
│   ├── Society.js               # Property/Society model
│   ├── AssetLibraryItem.js      # Asset type definitions
│   ├── Asset.js                 # Individual asset instances
│   ├── Task.js                  # Maintenance task model
│   └── Issue.js                 # Issue tracking model
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── societies.js             # Society management routes
│   ├── assetLibrary.js          # Asset library routes
│   ├── assets.js                # Asset management routes
│   ├── tasks.js                 # Task & verification routes
│   ├── dashboard.js             # Dashboard routes
│   ├── issues.js                # Issue routes
│   ├── managers.js              # Manager routes
│   └── adminLinks.js            # Admin link routes
├── services/
│   └── supabaseStorageService.js # Signed URL generation & storage
├── scripts/
│   └── seedData.js              # Database seeding utilities
├── index.js                     # Application entry point
├── package.json                 # Dependencies & scripts
├── vercel.json                  # Vercel deployment config
└── .env.example                 # Environment variables template
```

**What to look at first** (for new engineers):
1. **Entry point**: `index.js` — Express setup, middleware, routes
2. **Database**: `config/database.js` — MongoDB connection
3. **Auth flow**: `middleware/authMiddleware.js` + `controllers/authController.js`
4. **Task lifecycle**: `controllers/tasksController.js` + `models/Task.js`
5. **Storage**: `services/supabaseStorageService.js` — signed upload URLs

---

## ⚙️ Environment Variables

Create a `.env` file with these variables:

```env
# Environment
NODE_ENV=development              # development | production

# Server
PORT=3000                         # HTTP port

# Database
MONGODB_URI=mongodb://localhost:27017/maintainly

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Supabase Storage
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
VERIFICATION_PHOTOS_BUCKET=verification-photos
```

**Production notes**:
- Use a strong, randomly generated `JWT_SECRET`
- Use MongoDB Atlas or managed MongoDB with proper backups
- Configure Supabase bucket policies (public or signed URLs)
- Set appropriate CORS origins in `index.js`

### Supabase Storage Setup
1. Create a bucket named `verification-photos` in your Supabase project
2. Set bucket to public OR configure RLS policies for signed URLs
3. Update `VERIFICATION_PHOTOS_BUCKET` if using a different name

---

## 💻 Development Workflow

### Available Scripts
```bash
npm start           # Start production server
npm run dev         # Start dev server with nodemon auto-reload
npm test            # Run tests (TODO: not implemented yet)
```

### Common Commands
```bash
# Generate a secure JWT secret
node generate-jwt-secret.js

# Seed database with sample data
node reset-and-seed.js

# Import Excel data
node import-excel-data.js
```

### Branching Strategy
- Create feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Open PRs with clear descriptions and testing steps

### Code Guidelines
- Follow existing style and folder structure
- Add input validation with `express-validator`
- Include error handling for all async operations
- Test auth/role requirements for protected endpoints
- Document complex business logic with comments

---

## 🎯 Data Models & Relationships

### User Roles
- **Admin**: Full system access — manages properties, creates tasks, verifies work
- **Manager**: Assigned to tasks — executes work, uploads verification photos

### Key Relationships
```
Admin → owns → Societies (properties)
Admin → creates → Asset Library Items (asset types)
Society + Asset Library Item → Asset instances
Assets → have → Maintenance Tasks
Tasks → assigned to → Managers
Tasks → contain → Verification Photos
```

### Task Status Flow
```
Pending
   ↓
InProgress (Manager starts work)
   ↓
PendingVerification (Manager submits photo)
   ↓                          ↓
Completed (Admin approves)   RequiresAttention (Admin rejects)
                                   ↓
                             InProgress (Manager reworks)
```

---

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Protected endpoints require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

Obtain token via `POST /api/auth/login`

### Core Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/login` | User login (returns JWT) | Public |
| POST | `/register-manager` | Register new manager | Admin |
| GET | `/me` | Get current user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change password | Private |

**Example: Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@maintainly.com",
  "password": "admin123"
}

# Response:
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@maintainly.com",
      "role": "admin",
      "name": "Admin User"
    }
  }
}
```

#### Societies (`/api/societies`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all societies | Admin |
| GET | `/:id` | Get society by ID | Admin |
| POST | `/` | Create new society | Admin |
| PUT | `/:id` | Update society | Admin |
| DELETE | `/:id` | Soft delete society | Admin |

#### Asset Library (`/api/asset-library`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all asset types | Admin |
| GET | `/:id` | Get asset type by ID | Admin |
| POST | `/` | Create asset type | Admin |
| PUT | `/:id` | Update asset type | Admin |
| DELETE | `/:id` | Delete asset type | Admin |

#### Assets (`/api/assets`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all assets (filtered by role) | Admin/Manager |
| GET | `/:id` | Get asset by ID | Admin/Manager |
| POST | `/` | Create new asset | Admin |
| PUT | `/:id` | Update asset | Admin |
| DELETE | `/:id` | Delete asset | Admin |

#### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get tasks (managers see only assigned) | Admin/Manager* |
| GET | `/:id` | Get task by ID | Admin/Manager* |
| POST | `/` | Create new task | Admin |
| PATCH | `/:id` | Update task details | Admin |
| DELETE | `/:id` | Delete task | Admin |
| POST | `/:id/start` | Start task (change to InProgress) | Manager* |
| POST | `/:id/submit-for-verification` | Submit photo for review | Manager* |
| POST | `/:id/verify` | Approve or reject task | Admin |
| POST | `/upload-url` | Get signed upload URL | Admin/Manager |
| GET | `/dashboard/stats` | Get task statistics | Admin/Manager* |

*Managers can only access tasks assigned to them.

#### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/stats` | Get dashboard statistics | Admin/Manager |

#### Issues (`/api/issues`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all issues | Admin/Manager |
| POST | `/` | Create new issue | Admin/Manager |
| PUT | `/:id` | Update issue | Admin |
| DELETE | `/:id` | Delete issue | Admin |

#### Managers (`/api/managers`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all managers | Admin |
| POST | `/` | Create new manager | Admin |
| PUT | `/:id` | Update manager | Admin |
| DELETE | `/:id` | Delete manager | Admin |

---

## 🔄 Task Lifecycle & Photo Verification

### Task Status Flow

The task workflow follows these states:

1. **Pending** → Manager can start the task
2. **InProgress** → Manager is working on the task
3. **PendingVerification** → Manager submitted photo for admin review
4. **Completed** → Admin approved the work
5. **RequiresAttention** → Admin rejected, needs rework

### Photo Verification Workflow

**Step 1: Manager requests upload URL**
```bash
POST /api/tasks/upload-url
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "fileName": "task-completion-photo.jpg",
  "fileType": "image/jpeg"
}

# Response:
{
  "status": "success",
  "data": {
    "uploadUrl": "https://supabase.co/storage/v1/...",
    "publicUrl": "https://supabase.co/storage/v1/object/public/..."
  }
}
```

**Step 2: Manager uploads file to Supabase**
```bash
PUT <uploadUrl from step 1>
Content-Type: image/jpeg

<binary file data>
```

**Step 3: Manager submits task for verification**
```bash
POST /api/tasks/:taskId/submit-for-verification
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "photoUrl": "<publicUrl from step 1>",
  "completionNotes": "Repaired elevator motor, tested all floors"
}

# Task status changes: InProgress → PendingVerification
```

**Step 4: Admin reviews and verifies**
```bash
POST /api/tasks/:taskId/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

# Approve:
{
  "action": "approve",
  "verificationNotes": "Work looks good, all tests passed"
}

# Or reject:
{
  "action": "reject",
  "rejectionReason": "Photo does not show completed repair",
  "verificationNotes": "Please retake photo showing the motor"
}

# Status changes: PendingVerification → Completed (or RequiresAttention)
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with configurable expiry
- **Role-based Authorization**: Middleware enforces Admin/Manager permissions
- **Input Validation**: express-validator on all inputs
- **Password Security**: bcryptjs with salt rounds
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers (XSS, noSniff, frameGuard)
- **Resource Ownership**: Users only access their assigned data
- **Soft Deletes**: Critical data preserved with `isDeleted` flag

**Security Checklist for Production**:
- [ ] Generate strong `JWT_SECRET` (min 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domains only
- [ ] Set up rate limiting (TODO: not implemented)
- [ ] Enable MongoDB authentication
- [ ] Configure Supabase RLS policies
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable audit logging for admin actions

---

## 📊 API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response payload here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [  // Optional: validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200 OK` — Successful GET/PUT/PATCH
- `201 Created` — Successful POST
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Missing or invalid token
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `500 Internal Server Error` — Server error

---

## 🚀 Deployment

### Vercel Deployment
This project includes `vercel.json` for serverless deployment.

**Environment Variables** (set in Vercel dashboard):
- `NODE_ENV=production`
- `MONGODB_URI=<your-atlas-uri>`
- `JWT_SECRET=<strong-secret>`
- `SUPABASE_URL=<your-supabase-url>`
- `SUPABASE_ANON_KEY=<your-anon-key>`
- `VERIFICATION_PHOTOS_BUCKET=verification-photos`

**Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Traditional Server Deployment

```bash
# 1. Set environment to production
export NODE_ENV=production

# 2. Install production dependencies only
npm ci --production

# 3. Start with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name maintainly-backend

# 4. Configure nginx reverse proxy (optional)
# Point nginx to http://localhost:3000
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 Testing

**Current Status**: Tests not yet implemented (see TODO below)

**Recommended Test Structure**:
```
backend/tests/
├── unit/
│   ├── models/
│   ├── controllers/
│   └── services/
├── integration/
│   ├── auth.test.js
│   ├── tasks.test.js
│   └── photo-verification.test.js
└── setup.js
```

**Test Stack Recommendations**:
- Framework: Jest or Mocha
- Assertions: Chai or Jest matchers
- HTTP testing: Supertest
- Mocking: Sinon or Jest mocks
- Test DB: MongoDB Memory Server

---

## 🎓 Onboarding Checklist

For new backend engineers joining the team:

- [ ] **Environment Setup**: Clone repo, install Node.js 16+, install dependencies
- [ ] **Local Development**: Set up `.env`, start MongoDB, run `npm run dev`
- [ ] **Health Check**: Visit `http://localhost:3000/health` and confirm response
- [ ] **Database**: Connect to MongoDB, inspect collections, review schemas
- [ ] **Default Admin**: Log in with default admin credentials via `/api/auth/login`
- [ ] **API Exploration**: Use Postman/Thunder Client to test key endpoints
- [ ] **Task Workflow**: Create a task, assign to manager, walk through full verification flow
- [ ] **Code Review**: Read `index.js`, `authMiddleware.js`, `tasksController.js`
- [ ] **Storage**: Test Supabase signed URL generation and file upload
- [ ] **Documentation**: Review this README and other docs in `backend/` folder

**Recommended first tasks**:
1. Fix a small bug or add input validation
2. Add a new endpoint with auth/role checks
3. Write unit tests for a controller or service
4. Improve error handling in a specific flow

---

## 📚 Additional Documentation

- `DATA_MAPPING_GUIDE.md` — Database schema and data relationships
- `SPEED_INSIGHTS_SETUP.md` — Performance monitoring setup
- `vercel.json` — Vercel deployment configuration
- `.env.example` — Complete environment variable reference

---

## 🛠️ TODO / Future Enhancements

- [ ] **Testing**: Add unit and integration tests with Jest
- [ ] **Rate Limiting**: Implement with express-rate-limit
- [ ] **API Docs**: Generate with Swagger/OpenAPI
- [ ] **Logging**: Add structured logging with Winston or Pino
- [ ] **Caching**: Implement Redis caching for frequent queries
- [ ] **Notifications**: Email/SMS notifications for task updates
- [ ] **Scheduling**: Cron jobs for recurring tasks and reminders
- [ ] **Real-time**: WebSocket support with Socket.io
- [ ] **File Validation**: Size limits, type checking, virus scanning
- [ ] **Audit Logs**: Track all admin actions with timestamps
- [ ] **Metrics**: Prometheus metrics for monitoring
- [ ] **GraphQL**: Consider GraphQL API alongside REST

---

## 🤝 Contributing

1. **Fork/branch** from `main`
2. **Implement** feature or fix with clear commit messages
3. **Test** locally and ensure no regressions
4. **Document** any new endpoints or env variables
5. **Open PR** with description, testing steps, and screenshots

**Commit Message Format**:
```
<type>(<scope>): <subject>

Examples:
feat(tasks): add bulk task assignment endpoint
fix(auth): resolve token expiry edge case
docs(readme): update deployment instructions
```

---

## 📞 Support & Contact

**Repository**: [maintainly-backend](https://github.com/dbajaj123/maintainly-backend)

**Key Entry Points**:
- Application: `index.js`
- Database: `config/database.js`
- Auth: `middleware/authMiddleware.js`

**For Issues**:
1. Check console logs and error messages
2. Verify environment variables are set correctly
3. Confirm MongoDB and Supabase connections
4. Review this README and related docs

---

**Built with ❤️ for the Maintainly Team**
