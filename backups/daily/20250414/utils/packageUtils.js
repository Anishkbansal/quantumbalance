import UserPackage from '../models/UserPackage.js';
import User from '../models/User.js';

/**
 * Updates renewal eligibility for all active packages in the system
 * Can be called manually by admin or via cron job
 * 
 * @returns {Object} Stats about the update operation
 */
export const updateAllPackageRenewalStatus = async () => {
  try {
    // Get all active packages
    const activePackages = await UserPackage.find({ isActive: true });
    
    let eligibleCount = 0;
    let notEligibleCount = 0;
    let errorCount = 0;
    
    // Check each package
    for (const userPackage of activePackages) {
      try {
        const isEligible = await userPackage.updateRenewalEligibility();
        
        if (isEligible) {
          eligibleCount++;
        } else {
          notEligibleCount++;
        }
      } catch (error) {
        console.error(`Error updating package ${userPackage._id}:`, error);
        errorCount++;
      }
    }
    
    return {
      totalProcessed: activePackages.length,
      eligibleCount,
      notEligibleCount,
      errorCount
    };
  } catch (error) {
    console.error('Error updating package renewal status:', error);
    throw error;
  }
};

/**
 * Get packages eligible for renewal for a specific user
 * 
 * @param {string} userId 
 * @returns {Array} Eligible packages
 */
export const getUserRenewalEligiblePackages = async (userId) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's renewal eligibility status
    const renewalStatus = await user.checkRenewalEligibility();
    
    if (!renewalStatus.isEligible) {
      return {
        isEligible: false,
        message: renewalStatus.message,
        eligiblePackages: []
      };
    }
    
    return {
      isEligible: true,
      package: renewalStatus.package,
      eligibleDate: renewalStatus.renewalEligibleDate,
      message: renewalStatus.message
    };
  } catch (error) {
    console.error('Error getting user renewal eligible packages:', error);
    throw error;
  }
};

/**
 * Calculate the new expiry date when renewing a package
 * Takes into account the current expiry date and the duration of the new package
 * 
 * @param {Date} currentExpiryDate 
 * @param {number} newPackageDurationDays 
 * @returns {Date} New expiry date
 */
export const calculateRenewalExpiryDate = (currentExpiryDate, newPackageDurationDays) => {
  const newExpiryDate = new Date(currentExpiryDate);
  newExpiryDate.setDate(newExpiryDate.getDate() + newPackageDurationDays);
  return newExpiryDate;
};

/**
 * Format time remaining until expiration in a human-readable format
 * 
 * @param {Date} expiryDate 
 * @returns {Object} Formatted time remaining
 */
export const formatTimeRemaining = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  
  // If already expired
  if (now > expiry) {
    return {
      expired: true,
      formattedTime: 'Expired'
    };
  }
  
  const diffTime = Math.abs(expiry - now);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  let formattedTime = '';
  
  if (diffDays > 0) {
    formattedTime += `${diffDays} day${diffDays !== 1 ? 's' : ''} `;
  }
  
  if (diffHours > 0 || diffDays > 0) {
    formattedTime += `${diffHours} hour${diffHours !== 1 ? 's' : ''} `;
  }
  
  formattedTime += `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  
  return {
    expired: false,
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    formattedTime: formattedTime.trim()
  };
}; 