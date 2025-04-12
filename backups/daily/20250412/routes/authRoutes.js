import express from 'express';
import { register, login, logout, getUser, getAllUsers, getUserDetails, adminCreateUser, verifyEmail, sendVerificationCode, cleanupUnverifiedUsers, deleteAccount, sendDeletionCode, updateProfile, verifyAdminOTP } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health check endpoint (no auth required)
router.get('/check', (req, res) => {
  res.status(200).json({ success: true, message: 'Auth server is running' });
});

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', logout);

// Get current user
router.get('/user', getUser);

// Update profile
router.post('/update-profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:userId', protect, adminOnly, getUserDetails);
router.post('/admin/create-user', protect, adminOnly, adminCreateUser);
router.post('/admin/cleanup-users', protect, adminOnly, cleanupUnverifiedUsers);
router.post('/admin/verify-otp', verifyAdminOTP);

// Verification routes
router.post('/verify-email', verifyEmail);
router.post('/send-verification', sendVerificationCode);

// Account deletion routes
router.post('/delete-account', protect, deleteAccount);
router.post('/send-deletion-code', protect, sendDeletionCode);

export default router; 