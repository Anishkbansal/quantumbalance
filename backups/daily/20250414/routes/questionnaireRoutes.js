import express from 'express';
import { 
  saveQuestionnaire, 
  getQuestionnaire, 
  updateQuestionnaire,
  saveQuestionnaireHistory
} from '../controllers/questionnaireController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generateAIPrescription } from '../utils/prescriptionService.js';

const router = express.Router();

// Protected routes - require authentication
router.post('/create', protect, saveQuestionnaire);
router.get('/', protect, getQuestionnaire);
router.put('/update', protect, updateQuestionnaire);
router.post('/history', protect, saveQuestionnaireHistory);

// Generate AI prescription on demand
router.post('/generate-prescription', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Manual request to generate AI prescription for user ${userId}`);
    
    // Generate AI prescription
    const prescriptionResult = await generateAIPrescription(userId);
    
    if (prescriptionResult.success) {
      console.log(`********** AI PRESCRIPTION GENERATED ON DEMAND **********`);
      console.log(`Generated prescription ID: ${prescriptionResult.prescription._id}`);
      console.log(`For user: ${userId}`);
      console.log(`Number of frequencies: ${prescriptionResult.prescription.frequencies.length}`);
      
      return res.status(200).json({
        success: true,
        message: 'AI prescription generated successfully',
        data: {
          prescription: {
            id: prescriptionResult.prescription._id,
            title: prescriptionResult.prescription.title,
            frequencies: prescriptionResult.prescription.frequencies,
            timing: prescriptionResult.prescription.timing
          }
        }
      });
    } else {
      console.error(`Failed to generate AI prescription on demand for user ${userId}:`, prescriptionResult.message);
      return res.status(400).json({
        success: false,
        message: prescriptionResult.message || 'Failed to generate AI prescription'
      });
    }
  } catch (error) {
    console.error('Error generating AI prescription on demand:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating AI prescription',
      error: error.message
    });
  }
});

export default router; 