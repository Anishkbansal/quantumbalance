import WellnessEntry from '../models/Wellness.js';

/**
 * Middleware to check if a user should be reminded to submit wellness data
 * This middleware should be used after the auth middleware
 */
export const checkWellnessReminder = async (req, res, next) => {
  try {
    // Only proceed if there's an authenticated user
    if (!req.user) {
      return next();
    }
    
    // Skip for admin users
    if (req.user.isAdmin) {
      return next();
    }
    
    // Skip for users without packages or questionnaires
    if (req.user.packageType === 'none' || !req.user.activePackageId || !req.user.healthQuestionnaire) {
      return next();
    }
    
    // Check if user's package is expired
    const isPackageExpired = await req.user.isPackageExpired();
    if (isPackageExpired) {
      return next();
    }
    
    // Check if user should be prompted for wellness data
    const shouldPrompt = await WellnessEntry.shouldPromptUser(req.user._id);
    
    // Add property to request object that can be used by route handlers
    req.shouldPromptWellness = shouldPrompt;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error in wellness reminder middleware:', error);
    // Continue to next middleware even on error
    next();
  }
}; 