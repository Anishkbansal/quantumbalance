# Quantum Balance Setup Instructions

## Overview

The application has been configured to run both the React frontend and Express backend with a single command. The authentication system is now fully functional with register, login, and logout capabilities.

## Prerequisites

1. Make sure MongoDB is installed and running on your system
   - Default connection: `mongodb://localhost:27017/quantum_balance`
   - Or update the connection string in `.env`

2. Node.js and npm should be installed on your system

## Quick Start

To run both the frontend and backend together:

```
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:5000

## Running Separately (if needed)

To run just the frontend:
```
npm start
```

To run just the backend:
```
npm run server
```

## Authentication Features

- User registration: `/register`
- User login: `/login`
- Protected routes for authenticated users
- Session persistence with MongoDB storage
- Automatic logout when session expires

## Backend API

The backend API is available at http://localhost:5000/api with the following endpoints:

- POST `/api/auth/register` - Create a new user account
- POST `/api/auth/login` - Authenticate a user
- POST `/api/auth/logout` - End a user session
- GET `/api/auth/user` - Get current authenticated user

## Troubleshooting

If you encounter any issues:

1. Make sure MongoDB is running
2. Check that ports 3000 and 5000 are available
3. Check the console for error messages
4. Ensure all dependencies are installed with `npm install`

## Technical Implementation

- Backend: Express.js with ES Modules
- Database: MongoDB with Mongoose
- Authentication: Express-session with MongoDB store
- Frontend: React with Context API for auth state

The application maintains the original UI and design as requested, with added functionality for user authentication. 