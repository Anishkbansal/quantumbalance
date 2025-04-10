import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import audioFileController from '../controllers/audioFileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/audio');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

// Routes
router.post('/upload', requireAuth, upload.single('audioFile'), audioFileController.uploadAudioFile);
router.get('/user/:userId', requireAuth, audioFileController.getUserAudioFiles);
router.get('/file/:id', audioFileController.getAudioFileDetails);
router.get('/:id', audioFileController.getAudioFile); // Secure streaming endpoint
router.delete('/:id', requireAuth, audioFileController.deleteAudioFile);
router.patch('/:id', requireAuth, audioFileController.updateAudioFile);

export default router; 