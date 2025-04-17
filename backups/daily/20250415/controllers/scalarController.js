import { sendScalarHealingRequest } from '../utils/emailService.js';

/**
 * Handle requests for scalar healing information
 */
export const requestInfo = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Send email to admins
    await sendScalarHealingRequest({
      name,
      email,
      phone,
      message
    });
    
    return res.status(200).json({
      success: true,
      message: 'Request received. We will contact you shortly.'
    });
  } catch (error) {
    console.error('Error processing scalar healing request:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
}; 