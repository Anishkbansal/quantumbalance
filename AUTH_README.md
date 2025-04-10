# Authentication System for Quantum Balance

The application now has a complete authentication system with the following features:
- User registration
- User login 
- User logout
- Session-based authentication
- Protected routes

## How to Run the Application

You can now run both the frontend and backend with a single command:

```
npm run dev
```

This will start:
- The React frontend on http://localhost:3000
- The Express backend on http://localhost:5000

## Testing the Authentication

1. Register a new account at http://localhost:3000/register
2. Login with your credentials at http://localhost:3000/login
3. After logging in, you'll be redirected to the dashboard
4. Test protected routes by trying to access them while logged in/out
5. Use the logout button to end your session

## Implementation Details

### Backend

- Uses Express sessions with MongoDB store for session persistence
- Password hashing with bcrypt
- Session cookie for maintaining authentication
- RESTful API endpoints for auth operations

### Frontend

- React context API for managing auth state
- Protected routes using React Router
- Login and registration forms
- Automatic session restoration on refresh

## API Endpoints

- `POST /api/auth/register`: Register a new user
  - Request: `{ name, email, username, password }`
  - Response: User data with session cookie

- `POST /api/auth/login`: Login a user
  - Request: `{ username, password }`
  - Response: User data with session cookie

- `POST /api/auth/logout`: Logout a user
  - Response: Success message

- `GET /api/auth/user`: Get current user data
  - Response: User data if authenticated

## Folder Structure

- `src/controllers/authController.js`: Authentication logic
- `src/routes/authRoutes.js`: API routes
- `src/models/User.js`: User model with password hashing
- `src/contexts/AuthContext.tsx`: React context for auth state
- `src/components/auth/`: Protected route components

## Requirements

- MongoDB should be running locally or accessible via connection string
- Node.js v14+ recommended 