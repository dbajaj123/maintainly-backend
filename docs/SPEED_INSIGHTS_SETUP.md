# Vercel Speed Insights Setup for Backend

This guide explains how Vercel Speed Insights has been integrated into your Express.js backend to track API performance.

## What's Been Added

### 1. Package Installation
- Added `@vercel/speed-insights` to package.json dependencies

### 2. Speed Insights Middleware
- Created `middleware/speedInsights.js` with the following features:
  - Automatic API endpoint performance tracking
  - Custom event tracking capabilities
  - Database operation performance monitoring
  - Error tracking and logging

### 3. Integration in Main App
- Added Speed Insights middleware to `index.js`
- Integrated into request pipeline after CORS and body parsing

### 4. Controller Enhancement
- Updated `authController.js` as an example showing:
  - Database operation tracking
  - Success/failure event tracking
  - Performance monitoring for login operations

## Features

### Automatic API Tracking
Every API call is automatically tracked with:
- Request method (GET, POST, PUT, DELETE)
- Route path and full URL
- Response status code
- Execution duration in milliseconds

### Database Operation Tracking
Use `trackDatabaseOperation()` to monitor:
- Database query performance
- Success/failure rates
- Error tracking

Example:
```javascript
const user = await trackDatabaseOperation(
  'User.findOne',
  () => User.findOne({ email, isActive: true }),
  { operation: 'login' }
);
```

### Custom Event Tracking
Track custom business metrics with `trackEvent()`:
```javascript
trackEvent('Auth: Login Success', 1, 'count', { role: user.role });
```

## Environment Variables (Optional)

For enhanced tracking, you can add these to your `.env` file:

```bash
# Vercel Configuration (Optional)
VERCEL_PROJECT_ID=your-vercel-project-id
VERCEL_TEAM_ID=your-vercel-team-id
```

## Metrics You'll See

### Automatically Tracked:
- `API: GET /api/auth/login` - Login endpoint performance
- `API: POST /api/societies` - Society creation performance
- `API: GET /api/dashboard` - Dashboard loading performance
- And more for all your API endpoints...

### Custom Tracked (from auth example):
- `Auth: Login Success` - Successful login count by role
- `Auth: Login Failed` - Failed login attempts with reason
- `DB: User.findOne` - Database query performance

## Performance Benefits

1. **API Monitoring**: Track slow endpoints and optimize them
2. **Database Performance**: Identify slow queries and bottlenecks
3. **Error Tracking**: Monitor failure rates and error patterns
4. **User Experience**: Understand real-world API performance

## Next Steps

1. **Deploy to Vercel**: The metrics will appear in your Vercel dashboard after deployment
2. **Add More Tracking**: Apply similar patterns to other controllers
3. **Monitor Trends**: Use the data to identify performance regressions

## Extending to Other Controllers

To add tracking to other controllers, follow this pattern:

```javascript
// 1. Import the tracking functions
const { trackDatabaseOperation, trackEvent } = require('../middleware/speedInsights');

// 2. Wrap database operations
const result = await trackDatabaseOperation(
  'ModelName.operation',
  () => Model.findOne(query),
  { additionalTags: 'here' }
);

// 3. Track business events
trackEvent('Business: Event Name', value, 'unit', { tags });
```

## Viewing Results

After deployment to Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Navigate to the "Speed Insights" tab
4. View real-time performance metrics and trends

The middleware respects Vercel's serverless environment and will only track when deployed on Vercel or when explicitly configured.