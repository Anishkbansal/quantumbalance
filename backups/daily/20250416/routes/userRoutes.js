import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get admin user for messaging
router.get('/admin', protect, async (req, res) => {
  try {
    // Find the first admin user
    const admin = await User.findOne({ isAdmin: true }).select('_id name isAdmin');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    return res.status(200).json({ 
      success: true, 
      admin: {
        _id: admin._id,
        name: admin.name,
        isAdmin: admin.isAdmin
      } 
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin user' });
  }
});

export default router; 