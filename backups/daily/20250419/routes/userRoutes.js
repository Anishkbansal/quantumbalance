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

// Update user's preferred currency
router.post('/update-currency', protect, async (req, res) => {
  try {
    const { currency } = req.body;
    
    if (!currency) {
      return res.status(400).json({ 
        success: false, 
        message: 'Currency code is required' 
      });
    }
    
    // Validate currency code (should match enum in User model)
    const validCurrencies = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'INR'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid currency code' 
      });
    }
    
    // Update user's preferred currency
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { preferredCurrency: currency },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Currency preference updated successfully',
      preferredCurrency: updatedUser.preferredCurrency
    });
  } catch (error) {
    console.error('Error updating user currency preference:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error updating currency preference' 
    });
  }
});

export default router; 