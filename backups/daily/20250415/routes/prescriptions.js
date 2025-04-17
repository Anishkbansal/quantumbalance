import express from 'express';
import { protect as isAuthenticated, adminOnly as isAdmin } from '../middleware/authMiddleware.js';
import Prescription from '../models/Prescription.js';
import AudioFile from '../models/AudioFile.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get a prescription by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Error fetching prescription' });
  }
});

// Link an audio file to a prescription frequency
router.post('/:id/link-audio', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { frequencyId, audioId } = req.body;
    
    if (!frequencyId || !audioId) {
      return res.status(400).json({ message: 'Frequency ID and Audio ID are required' });
    }
    
    // Check if prescription exists
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if audio file exists
    const audioFile = await AudioFile.findById(audioId);
    if (!audioFile) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    // Find and update the frequency with the audio ID
    const updated = await Prescription.findOneAndUpdate(
      { 
        _id: req.params.id,
        "frequencies._id": new mongoose.Types.ObjectId(frequencyId)
      },
      { 
        $set: { 
          "frequencies.$.audioId": new mongoose.Types.ObjectId(audioId)
        }
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Frequency not found in prescription' });
    }
    
    res.json({ 
      message: 'Audio file linked successfully',
      prescription: updated
    });
  } catch (error) {
    console.error('Error linking audio file:', error);
    res.status(500).json({ message: 'Error linking audio file' });
  }
});

// Remove audio link from a prescription frequency
router.delete('/:id/unlink-audio/:frequencyId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Update the frequency to remove the audio ID
    const updated = await Prescription.findOneAndUpdate(
      { 
        _id: req.params.id,
        "frequencies._id": new mongoose.Types.ObjectId(req.params.frequencyId)
      },
      { 
        $set: { 
          "frequencies.$.audioId": null
        }
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Prescription or frequency not found' });
    }
    
    res.json({ 
      message: 'Audio file unlinked successfully',
      prescription: updated
    });
  } catch (error) {
    console.error('Error unlinking audio file:', error);
    res.status(500).json({ message: 'Error unlinking audio file' });
  }
});

export default router; 