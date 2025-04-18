import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content
 * @param {string} options.html - Email HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async (options) => {
  try {
    const { to, subject, text, html } = options;
    
    if (!to || !subject || (!text && !html)) {
      throw new Error('Missing required email fields');
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      ...(html && { html }),
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send a notification email to all admin users
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise<boolean>} - Success status
 */
export const sendAdminNotification = async (subject, message) => {
  try {
    // Get admin emails from environment variables
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured for notifications');
      return false;
    }
    
    const promises = adminEmails.map(email => 
      sendEmail({
        to: email.trim(),
        subject,
        text: message
      })
    );
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error sending admin notifications:', error);
    return false;
  }
};

export default {
  sendEmail,
  sendAdminNotification
}; 