import express from 'express';
import { 
  getAllPackages, 
  getPackageById, 
  getUserPackages, 
  purchasePackage,
  redeemGiftCode,
  createGiftCode,
  getUserActivePackage,
  checkPackageExpiry,
  createPackage,
  checkRenewalEligibility,
  renewPackage,
  getRenewalHistory,
  testExpiredPackages,
  forceCheckExpiredPackages
} from '../controllers/packageController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { requireVerification } from '../middleware/verificationMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Public routes
router.get('/all', getAllPackages);

// Protected routes
router.get('/:id', protect, getPackageById);
router.get('/user/packages', protect, getUserPackages);

// Protected routes that require verification
router.post('/purchase', protect, requireVerification, purchasePackage);
router.post('/redeem', protect, requireVerification, redeemGiftCode);
router.get('/user/active', protect, getUserActivePackage);
router.get('/user/renewal-eligibility', protect, checkRenewalEligibility);
router.get('/user/renewal-history', protect, getRenewalHistory);
router.post('/user/renew', protect, requireVerification, renewPackage);

// Route to get user's package by userId - used by admins
router.get('/users/:userId/package', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Only admin can check other users' packages
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Find user and populate activePackage
    const user = await mongoose.model('User').findById(userId)
      .select('packageType activePackage')
      .populate('activePackage.packageId', 'name type duration price features');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // User has no active package
    if (!user.activePackage || !user.activePackage.packageId) {
      return res.status(200).json({
        success: true,
        message: 'User has no active package',
        packageInfo: null
      });
    }
    
    // Get the active package details
    const packageInfo = {
      packageId: user.activePackage.packageId._id,
      name: user.activePackage.packageId.name,
      type: user.activePackage.packageId.type,
      duration: user.activePackage.packageId.duration,
      price: user.activePackage.packageId.price,
      features: user.activePackage.packageId.features,
      purchaseDate: user.activePackage.purchaseDate,
      expiryDate: user.activePackage.expiryDate,
      isActive: true
    };
    
    res.status(200).json({
      success: true,
      packageInfo
    });
  } catch (error) {
    console.error('Error getting user package:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin routes
router.post('/create', protect, adminOnly, createPackage);
router.post('/gift-code', protect, adminOnly, createGiftCode);
router.get('/check-expiry', protect, checkPackageExpiry);
router.get('/test-expired', protect, adminOnly, testExpiredPackages);
router.get('/check-expired', protect, adminOnly, forceCheckExpiredPackages);

export default router;