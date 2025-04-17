import express from 'express';
import { auth } from '../../middleware/auth.js';
import { 
  createWellnessEntry,
  getWellnessHistory,
  getWellnessStats,
  getWellnessReminder
} from '../../controllers/wellnessController.js';

const router = express.Router();

// @route   POST /api/wellness
// @desc    Create a new wellness entry
// @access  Private
router.post('/', auth, createWellnessEntry);

// @route   GET /api/wellness/history
// @desc    Get wellness history for a user
// @access  Private
router.get('/history', auth, getWellnessHistory);

// @route   GET /api/wellness/stats
// @desc    Get wellness statistics and trends
// @access  Private
router.get('/stats', auth, getWellnessStats);

// @route   GET /api/wellness/reminder
// @desc    Check if a wellness reminder should be shown
// @access  Private
router.get('/reminder', auth, getWellnessReminder);

export default router; 