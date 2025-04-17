import { sendScalarHealingRequest } from './emailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testScalarEmailRequest = async () => {
  try {
    const testFormData = {
      name: 'Test User',
      email: 'anishkbansal2007@gmail.com', // Email to receive the test message
      phone: '1234567890',
      message: 'This is a test request for scalar healing information. Please ignore this message.'
    };
    
    console.log('Sending test scalar healing request email...');
    const result = await sendScalarHealingRequest(testFormData);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending test scalar healing email:', error);
    throw error;
  }
};

// Execute immediately
testScalarEmailRequest()
  .then(() => console.log('Test complete'))
  .catch(err => console.error('Test failed:', err)); 