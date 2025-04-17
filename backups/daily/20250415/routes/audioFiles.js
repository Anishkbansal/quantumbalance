import express from 'express';
import multer from 'multer';
import { protect as isAuthenticated, adminOnly as isAdmin } from '../middleware/authMiddleware.js';
import AudioFile from '../models/AudioFile.js';

const router = express.Router();

// Configure multer for memory storage (will store in MongoDB)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Increase to 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an audio file
    const allowedMimeTypes = [
      'audio/mpeg', 
      'audio/mp3', 
      'audio/wav', 
      'audio/ogg',
      'audio/vorbis', // OGG Vorbis
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Supported types: MP3, WAV, OGG, M4A, and AAC.`), false);
    }
  }
});

// Error handling middleware for multer errors
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    // A non-Multer error occurred
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get all audio files (with optional search)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      // Use text search if search param is provided
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { condition: { $regex: search, $options: 'i' } },
          { frequencies: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const audioFiles = await AudioFile.find(query).select('-fileData').sort({ createdAt: -1 });
    
    res.json(audioFiles);
  } catch (error) {
    console.error('Error fetching audio files:', error);
    res.status(500).json({ message: 'Error fetching audio files' });
  }
});

// Check if a file with given name exists
router.get('/check', isAuthenticated, async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }
    
    const existingFile = await AudioFile.findOne({ name: filename });
    
    res.json({
      exists: !!existingFile
    });
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).json({ message: 'Error checking file existence' });
  }
});

// Upload a new audio file - use the error handling middleware
router.post('/upload', isAuthenticated, isAdmin, (req, res, next) => {
  upload.single('audioFile')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const { name, condition, frequencies } = req.body;
    
    if (!name || !condition) {
      return res.status(400).json({ message: 'Name and condition are required' });
    }
    
    // Check if file with same name already exists
    const existingFile = await AudioFile.findOne({ name });
    if (existingFile) {
      return res.status(400).json({ message: 'A file with this name already exists' });
    }
    
    // Parse frequencies from comma-separated string to array
    const frequenciesArray = frequencies 
      ? frequencies.split(',').map(freq => freq.trim())
      : [];
    
    // Create the new audio file
    const audioFile = new AudioFile({
      name,
      condition,
      frequencies: frequenciesArray,
      fileData: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id
    });
    
    await audioFile.save();
    
    // Return file details without the binary data
    res.status(201).json({
      success: true,
      message: 'Audio file uploaded successfully',
      audioFile: audioFile.getDetails()
    });
  } catch (error) {
    console.error('Error uploading audio file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading audio file',
      error: error.message 
    });
  }
});

// Get a specific audio file by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const audioFile = await AudioFile.findById(req.params.id);
    
    if (!audioFile) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    // Set headers for streaming instead of download
    res.set('Content-Type', audioFile.contentType);
    res.set('Content-Length', audioFile.size);
    res.set('Accept-Ranges', 'bytes');
    
    // If range request, handle it for audio streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : audioFile.size - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${audioFile.size}`);
      res.set('Content-Length', chunksize);
      
      // Create buffer from the range
      const buffer = audioFile.fileData.slice(start, end + 1);
      return res.send(buffer);
    }
    
    // Send the file data without download header
    res.send(audioFile.fileData);
  } catch (error) {
    console.error('Error fetching audio file:', error);
    res.status(500).json({ message: 'Error fetching audio file' });
  }
});

// Get audio file details without the file data
router.get('/:id/details', isAuthenticated, async (req, res) => {
  try {
    const audioFile = await AudioFile.findById(req.params.id).select('-fileData');
    
    if (!audioFile) {
      return res.status(404).json({ 
        success: false,
        message: 'Audio file not found' 
      });
    }
    
    // Return file details without the binary data
    res.json({
      success: true,
      audioFile: {
        _id: audioFile._id,
        name: audioFile.name,
        condition: audioFile.condition,
        frequencies: audioFile.frequencies,
        contentType: audioFile.contentType,
        size: audioFile.size,
        createdAt: audioFile.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching audio file details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching audio file details',
      error: error.message
    });
  }
});

// Delete an audio file
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const audioFile = await AudioFile.findByIdAndDelete(req.params.id);
    
    if (!audioFile) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    res.json({ message: 'Audio file deleted successfully' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ message: 'Error deleting audio file' });
  }
});

export default router; 