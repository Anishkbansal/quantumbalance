import express from 'express';
import { getDefaultAudioFiles } from '../controllers/audioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/default', protect, getDefaultAudioFiles);

// New route for premium sonic library
router.get('/premium-library', protect, async (req, res) => {
  try {
    // Check if user has premium package
    const user = req.user;
    if (user.packageType !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium package required to access the sonic library'
      });
    }
    
    // Import AudioFile model
    const AudioFile = (await import('../models/AudioFile.js')).default;
    
    // Fetch all audio files
    const audioFiles = await AudioFile.find().select('-fileData').sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      audioFiles
    });
  } catch (error) {
    console.error('Error fetching premium audio library:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching audio library',
      error: error.message
    });
  }
});

export default router; 