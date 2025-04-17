import express from 'express';
import { 
  createWellnessEntry, 
  getWellnessHistory, 
  getWellnessReminder,
  getWellnessStats 
} from '../controllers/wellnessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with auth middleware
router.use(protect);

// Submit a new wellness entry
router.post('/submit', createWellnessEntry);

// Get wellness history for the logged-in user
router.get('/history', getWellnessHistory);

// Check if user should be prompted for wellness data
router.get('/check-last-entry', getWellnessReminder);

// Get wellness statistics and trends
router.get('/stats', getWellnessStats);

export default router; 