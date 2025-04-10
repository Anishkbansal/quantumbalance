import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes
export const protect = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request path:', req.path);
    console.log('Auth middleware - Method:', req.method);
    console.log('Auth middleware - Session exists:', !!req.session);
    console.log('Auth middleware - Session userId:', req.session?.userId);
    
    // First check if user is authenticated via session
    if (req.session && req.session.userId) {
      console.log('Auth middleware - Using session auth for user ID:', req.session.userId);
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        return next();
      } else {
        console.log('Auth middleware - User not found with session ID');
      }
    }

    // If not authenticated via session, check for token auth
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
        console.log('Auth middleware - Using token auth');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        console.log('Auth middleware - Token decoded for user ID:', decoded.id);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');
        
        if (req.user) {
          console.log('Auth middleware - User found by token:', req.user._id);
          return next();
        } else {
          console.log('Auth middleware - User not found with token ID');
        }
      } catch (error) {
        console.error("Token verification error:", error);
      }
    } else {
      console.log('Auth middleware - No authorization header found');
    }

    // If no authentication method worked
    console.log('Auth middleware - Authentication failed');
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please log in.' 
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Admin middleware
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Verify email middleware
export const verificationRequired = (req, res, next) => {
  // Skip verification check for admin users
  if (req.user && req.user.isAdmin) {
    return next();
  }

  // Check if user is verified
  if (req.user && req.user.isVerified) {
    return next();
  } else {
    // If not verified, send an error response
    return res.status(403).json({ 
      success: false,
      message: 'Email verification required',
      requiresVerification: true,
      email: req.user?.email
    });
  }
}; 