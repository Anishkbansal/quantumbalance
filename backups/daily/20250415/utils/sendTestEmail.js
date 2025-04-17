import { sendVerificationEmail } from './emailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sendTestEmail = async () => {
  try {
    const testEmail = 'anishkbansal2007@gmail.com';
    const testName = 'Anish';
    const testCode = '123456';
    
    console.log('Sending test email to:', testEmail);
    const result = await sendVerificationEmail(testEmail, testName, testCode);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Execute immediately
sendTestEmail()
  .then(() => console.log('Test complete'))
  .catch(err => console.error('Test failed:', err)); 