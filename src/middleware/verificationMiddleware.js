import User from '../models/User.js';

/**
 * Middleware to check if user's email is verified
 * Will be used to protect sensitive routes that require email verification
 */
const requireVerification = async (req, res, next) => {
  try {
    // User should already be authenticated at this point, so we have req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if the user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
        requiresVerification: true,
        email: req.user.email
      });
    }

    // If user is verified or is admin, continue
    if (req.user.isVerified || req.user.isAdmin) {
      return next();
    }

    // Default deny
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('Verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in verification check'
    });
  }
};

export { requireVerification }; 