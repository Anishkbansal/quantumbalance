import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getActivePrescription, 
  getAllPrescriptions, 
  generatePrescription,
  migratePrescriptions,
  getBasicPrescriptionData
} from '../controllers/prescriptionController.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/active', protect, getActivePrescription);
router.get('/', protect, getAllPrescriptions);
router.post('/generate', protect, generatePrescription);
router.post('/migrate', protect, migratePrescriptions);
router.get('/:id/basic', protect, getBasicPrescriptionData);

export default router;
