# Quantum Balance

A modern web application for frequency healing and quantum health solutions. Quantum Balance offers personalized sonic prescriptions based on health questionnaires to help restore the body's natural balance.

## Project Overview

Quantum Balance is a platform that combines modern technology with frequency healing principles. The application allows users to:
- Complete detailed health questionnaires
- Receive personalized sonic prescriptions
- Track wellness progress over time
- Access different features based on subscription packages

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Zustand for state management
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password encryption
- SendGrid for email notifications

### Payment Processing
- Stripe integration for subscription and payment handling

## Current Implementation Status

### Completed
- Basic project structure and configuration
- MongoDB connection setup
- User schema with authentication support
- Database models structure

### In Progress
- API routes development
- Frontend components implementation
- Authentication flow
- Health questionnaire functionality

### Pending
- Complete user dashboard
- Admin panel for user management
- Payment processing integration
- Email verification
- Wellness tracking features

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/quantum_balance.git
   cd quantum_balance
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Environment Configuration
   Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/quantum_balance
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   ADMIN_CODE=your_admin_code
   SENDGRID_API_KEY=your_sendgrid_api_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   SESSION_SECRET=your_session_secret
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Application Structure

- `src/`: Main source code directory
  - `components/`: Reusable React components
  - `pages/`: Page components for different routes
  - `models/`: MongoDB data models
  - `config/`: Configuration files including database setup
  - `App.tsx`: Main application component
  - `index.tsx`: Application entry point

## Package Tiers

The application offers multiple subscription tiers:
1. **Single Session** - One-time payment for limited access
2. **Basic Plan** - 15-day access with core prescriptions
3. **Enhanced Plan** - Monthly subscription with additional features
4. **Premium Plan** - Complete access to all features and prescriptions

## Health Questionnaire

The application uses a comprehensive health questionnaire to gather information about:
- Current health concerns and their severity
- Pain locations and emotional state
- Toxin exposure and lifestyle factors
- Healing goals and priorities

This information is used to create personalized sonic prescriptions for each user.

## License

[MIT License](LICENSE)

## Contact

For any inquiries or support, please contact [project@email.com](mailto:project@email.com).

## Authentication System

The app now includes basic authentication with the following features:
- User registration
- Login
- Logout
- Session-based authentication
- Protected routes

## Running the Application

To run the application in development mode:

```
npm run dev
```

This will start both the React frontend on port 3000 and the Node.js backend on port 5000.

### Frontend Only

```
npm start
```

### Backend Only

```
npm run server
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Required fields: name, email, username, password
  - Returns user data and sets a session cookie

- `POST /api/auth/login` - Login a user
  - Required fields: username (or email), password
  - Returns user data and sets a session cookie

- `POST /api/auth/logout` - Logout a user
  - Destroys the session and clears the cookie

- `GET /api/auth/user` - Get the current authenticated user
  - Returns user data if authenticated

## Functionality

- The Register page allows users to create a new account
- The Login page allows users to authenticate
- Authenticated users are redirected to the Dashboard
- The Dashboard shows user information
- The Navbar includes a logout button when authenticated
- Protected routes ensure only authenticated users can access certain pages

# Quantum Balance - Package Management System

This system allows users to purchase and manage different healing packages. Here's how it works:

## Setup Instructions

1. **Initialize the Database**
   - Run `node src/utils/populatePackages.js` to populate the database with default packages
   - Run `node src/utils/populateTestUsers.js` to create or update test users with package information

2. **Available Packages**
   - Single Session ($15): 3-day access, 2 prescriptions
   - Basic Plan ($25): 15-day access, 4 prescriptions
   - Enhanced Plan ($45): 30-day access, 7 prescriptions
   - Premium Plan ($75): 30-day access, unlimited prescriptions

3. **Package Purchase Flow**
   - Users can purchase packages from the Packages page
   - Users complete the Health Questionnaire
   - After successful payment, the package is linked to the user's account

4. **User Interface**
   - The user's current package is displayed in their profile
   - Package details include name, price, features, and expiration date
   - Users can upgrade to a different package at any time

## Technical Implementation

- Package information is stored in MongoDB
- The User model includes a `packageId` field that references the Package model
- The `activePackage` object in the User model includes the package name, ID, and expiry date
- The system automatically checks for expired packages

## Admin Features

- Admins can seed default packages if none exist
- Admins can create gift codes for packages
- Admins can view all user packages

## API Endpoints

- `GET /api/packages/all` - Get all available packages
- `GET /api/packages/:id` - Get a specific package by ID
- `POST /api/packages/purchase` - Purchase a package
- `POST /api/packages/redeem` - Redeem a gift code
- `GET /api/packages/user/packages` - Get the current user's packages

# Payment Security

The Quantum Balance application follows best practices for payment handling:

1. **No Sensitive Data Storage:** We never store sensitive payment information in our database. Only payment reference IDs are stored.

2. **Simulated Payments:** Currently, the system uses simulated payments for demonstration purposes. 

3. **Future Stripe Integration:** The application is designed to integrate with Stripe:
   - All payment details will be handled directly by Stripe
   - Only reference IDs will be stored in our database
   - Server-side verification will ensure payment validity
   - All transactions will follow PCI compliance guidelines

4. **Payment Flow:**
   - When a user purchases a package, the system generates a payment intent
   - Only after payment confirmation is the user's account updated
   - All payment statuses are tracked for transparency

For detailed information on how Stripe integration will be implemented, see `src/utils/stripeIntegration.md`.

## New Features

### Premium Sonic Library Access

Premium package users now have exclusive access to the entire library of sonic prescriptions through a new "Sonic Library" tab on the dashboard. This feature gives premium users unrestricted access to all audio files in the system, organized by health condition for easy navigation.

Key features:
- All audio files are grouped by health condition
- Search functionality to find specific audio files by name, condition, or frequency
- Consistent audio player interface with play/pause, progress tracking, and loop functionality
- Each audio listing displays detailed frequency information
- Audio files are sorted alphabetically for easy access

### User Package Types and Features

| Package Type | Features |
|--------------|----------|
| Single       | Access to one prescription with default audio files |
| Basic        | Access to multiple prescriptions with default audio files |
| Enhanced     | Access to extended prescriptions with custom audio recommendations |
| Premium      | Full access to all prescriptions and the entire Sonic Library | 