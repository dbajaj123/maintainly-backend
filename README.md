# Property Maintenance Platform MVP Backend

A comprehensive property maintenance management system built with Node.js, Express.js, MongoDB, and Supabase Storage.

## 🏗️ Architecture Overview

This is a traditional monolithic Express.js application with the following structure:

- **Database**: MongoDB with Mongoose ODM
- **Storage**: Supabase for photo verification uploads
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (Admin/Manager)
- **Validation**: Express-validator for input validation
- **Security**: Helmet, CORS, and bcryptjs for password hashing

## 📁 Project Structure

```
property-maintenance-platform/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── societiesController.js   # Society management
│   ├── assetLibraryController.js # Asset library management
│   ├── assetsController.js      # Asset management
│   └── tasksController.js       # Task management & photo verification
├── middleware/
│   ├── authMiddleware.js        # JWT authentication middleware
│   ├── roleMiddleware.js        # Role-based authorization
│   └── errorHandler.js          # Global error handling
├── models/
│   ├── User.js                  # User model (Admin/Manager)
│   ├── Society.js               # Property/Society model
│   ├── AssetLibraryItem.js      # Asset type definitions
│   ├── Asset.js                 # Individual assets
│   └── Task.js                  # Maintenance tasks
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── societies.js             # Society CRUD routes
│   ├── assetLibrary.js          # Asset library CRUD routes
│   ├── assets.js                # Asset CRUD routes
│   └── tasks.js                 # Task management & verification routes
├── services/
│   └── supabaseStorageService.js # Supabase storage integration
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── index.js                     # Application entry point
└── package.json                 # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Supabase account and project

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   MONGODB_URI=mongodb://localhost:27017/property-maintenance
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   VERIFICATION_PHOTOS_BUCKET=verification-photos
   ```

3. **Set up Supabase Storage:**
   - Create a new bucket named `verification-photos` in your Supabase project
   - Set the bucket to public or configure appropriate policies
   - Update the bucket name in your `.env` file if different

4. **Start the server:**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify installation:**
   Visit `http://localhost:3000/health` to confirm the API is running.

## 👤 Default Admin Account

On first startup, a default admin account is created:
- **Email**: `admin@maintainly.com`
- **Password**: `admin123`
- **⚠️ Important**: Change this password immediately after first login

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/login` | User login | Public |
| POST | `/register-manager` | Register new manager | Admin |
| GET | `/me` | Get user profile | Private |
| PUT | `/profile` | Update profile | Private |
| PUT | `/change-password` | Change password | Private |

#### Societies (`/api/societies`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all societies | Admin |
| GET | `/:id` | Get society by ID | Admin |
| POST | `/` | Create new society | Admin |
| PUT | `/:id` | Update society | Admin |
| DELETE | `/:id` | Delete society (soft) | Admin |

#### Asset Library (`/api/asset-library`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all asset library items | Admin |
| GET | `/:id` | Get asset library item by ID | Admin |
| POST | `/` | Create new asset library item | Admin |
| PUT | `/:id` | Update asset library item | Admin |
| DELETE | `/:id` | Delete asset library item | Admin |

#### Assets (`/api/assets`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all assets | Admin/Manager |
| GET | `/:id` | Get asset by ID | Admin/Manager |
| POST | `/` | Create new asset | Admin |
| PUT | `/:id` | Update asset | Admin |
| DELETE | `/:id` | Delete asset | Admin |

#### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get tasks | Admin/Manager* |
| GET | `/:id` | Get task by ID | Admin/Manager* |
| POST | `/` | Create new task | Admin |
| PATCH | `/:id` | Update task | Admin |
| DELETE | `/:id` | Delete task | Admin |
| POST | `/:id/start` | Start task | Admin/Manager* |
| POST | `/:id/submit-for-verification` | Submit with photo | Manager* |
| POST | `/:id/verify` | Approve/reject task | Admin |
| POST | `/upload-url` | Get upload URL | Admin/Manager |
| GET | `/dashboard/stats` | Get statistics | Admin/Manager* |

*Managers can only access tasks assigned to them

## 🔄 Task Lifecycle & Photo Verification

The task workflow follows these states:

1. **Pending** → Manager can start the task
2. **InProgress** → Manager is working on the task  
3. **PendingVerification** → Manager submitted photo for admin review
4. **Completed** → Admin approved the work
5. **RequiresAttention** → Admin rejected, needs rework

### Photo Verification Workflow

1. **Manager uploads photo:**
   ```bash
   # 1. Get signed upload URL
   POST /api/tasks/upload-url
   {
     "fileName": "task-completion.jpg",
     "fileType": "image/jpeg"
   }
   
   # 2. Upload file directly to Supabase using returned uploadUrl
   POST <uploadUrl from step 1>
   Content-Type: image/jpeg
   <binary file data>
   
   # 3. Submit task for verification with public URL
   POST /api/tasks/:id/submit-for-verification
   {
     "photoUrl": "<publicUrl from step 1>",
     "completionNotes": "Task completed successfully"
   }
   ```

2. **Admin verifies:**
   ```bash
   POST /api/tasks/:id/verify
   {
     "action": "approve", // or "reject"
     "verificationNotes": "Work looks good",
     "rejectionReason": "Required only if action is reject"
   }
   ```

## 🎯 Data Models

### User Roles
- **Admin**: Manages properties, creates tasks, verifies completions
- **Manager**: Assigned to tasks, uploads verification photos

### Key Relationships
- Admin → owns multiple Societies
- Admin → creates Asset Library Items
- Society + Asset Library Item → creates Assets  
- Assets → have maintenance Tasks
- Tasks → assigned to Managers
- Tasks → contain verification photos

### Task Status Flow
```
Pending → InProgress → PendingVerification → Completed
                          ↓
                    RequiresAttention
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Authorization**: Admin/Manager permissions
- **Input Validation**: Express-validator on all inputs
- **Password Security**: bcryptjs hashing
- **CORS Protection**: Configurable origin policies
- **Helmet**: Security headers
- **Resource Ownership**: Users only access their own data

## 📊 API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error", 
  "message": "Error description",
  "errors": [ // Optional validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🛠️ Development

### Available Scripts
```bash
npm start        # Start production server
npm run dev      # Start development server with nodemon
npm test         # Run tests (not implemented yet)
```

### Environment Variables
See `.env.example` for all required environment variables.

### Database Setup
The application will automatically:
- Connect to MongoDB
- Create database indexes
- Create default admin user on first run

## 🚀 Production Deployment

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Use production MongoDB URI:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/property-maintenance
   ```

3. **Configure CORS for your domain:**
   Update CORS configuration in `index.js`

4. **Use strong JWT secret:**
   Generate a strong, unique JWT_SECRET

5. **Set up proper error monitoring and logging**

## 📝 TODO / Future Enhancements

- [ ] Add unit and integration tests
- [ ] Implement rate limiting
- [ ] Add API documentation with Swagger
- [ ] Add logging with Winston
- [ ] Implement caching with Redis
- [ ] Add email notifications
- [ ] Add task scheduling with cron jobs
- [ ] Implement real-time updates with Socket.io
- [ ] Add file upload size limits and validation
- [ ] Add audit logging for admin actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when available)
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For questions and support:
1. Check the API documentation above
2. Review the error messages in console logs
3. Ensure all environment variables are properly set
4. Verify MongoDB and Supabase connections

---

**Happy Coding! 🎉**#   m a i n t a i n l y - b a c k e n d  
 