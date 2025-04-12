import express from 'express';
import { 
  getAllPackages, 
  getPackageById, 
  purchasePackage,
  getUserPackages,
  redeemGiftCode,
  createGiftCode,
  createPackage,
  checkPackageExpiry,
  getUserActivePackage,
  checkRenewalEligibility,
  renewPackage,
  getRenewalHistory,
  testExpiredPackages,
  forceCheckExpiredPackages
} from '../controllers/packageController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllPackages);

// Protected routes
router.get('/:id', protect, getPackageById);
router.get('/user/packages', protect, getUserPackages);
router.post('/purchase', protect, purchasePackage);
router.post('/redeem', protect, redeemGiftCode);
router.post('/check-expiry', protect, checkPackageExpiry);
router.get('/user/active', protect, getUserActivePackage);

// Package renewal routes
router.get('/user/renewal-eligibility', protect, checkRenewalEligibility);
router.post('/user/renew', protect, renewPackage);
router.get('/user/renewal-history', protect, getRenewalHistory);

// Admin routes
router.post('/create', protect, adminOnly, createPackage);
router.post('/gift-code/create', protect, adminOnly, createGiftCode);
router.get('/test-expired', protect, adminOnly, testExpiredPackages);
router.get('/check-expired', protect, adminOnly, forceCheckExpiredPackages);

export default router;