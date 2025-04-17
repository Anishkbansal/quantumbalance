import express from 'express';
import { requestInfo } from '../controllers/scalarController.js';

const router = express.Router();

// Route for requesting scalar healing information
router.post('/request-info', requestInfo);

export default router; 