/**
 * Email Service Module - DUMMY VERSION
 * 
 * This is a dummy implementation that logs email details instead of actually sending emails.
 * This helps run the app without requiring actual email functionality.
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Verified sender email
const VERIFIED_SENDER = 'info@quantumbalance.co.uk';

/**
 * Creates a custom email template
 * 
 * @param {Object} options - Template options
 * @param {string} options.template - The template name
 * @param {Object} options.data - The data to populate the template with
 * @returns {Object} An object containing the html and text versions of the email
 */
export const createCustomEmailTemplate = (options) => {
  console.log('DUMMY EMAIL TEMPLATE CREATION (No actual email sent)');
  console.log('Template:', options.template);
  console.log('Data:', JSON.stringify(options.data, null, 2));
  
  return {
    html: `<p>Dummy HTML email for template "${options.template}"</p>`,
    text: `Dummy text email for template "${options.template}"`
  };
};

/**
 * Sends an email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<Object>} A promise that resolves with the email info
 */
export const sendEmail = async (options) => {
  console.log('DUMMY EMAIL SENDING (No actual email sent)');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  if (options.text) console.log('Text:', options.text);
  if (options.html) console.log('HTML:', options.html);
  
  // Return a mock response
  return {
    success: true,
    messageId: `dummy-message-id-${Date.now()}`,
    message: 'Email logged but not sent (dummy implementation)'
  };
};

/**
 * Send email verification code to user
 * @param {string} userEmail - Recipient email address
 * @param {string} name - User's name
 * @param {string} verificationCode - The code to be sent
 * @returns {Promise} - SendGrid API response
 */
export const sendVerificationEmail = async (userEmail, name, verificationCode) => {
  const msg = {
    to: userEmail,
    from: VERIFIED_SENDER,
    subject: 'Verify Your Quantum Balance Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">Hello ${name},</h3>
          <p>Thank you for registering with Quantum Balance. To complete your registration, please verify your email address using the code below:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; color: #2c3e50; letter-spacing: 5px;">${verificationCode}</h2>
          </div>
          <p>This code will expire in 30 minutes for security reasons.</p>
          <p>If you did not create an account with Quantum Balance, please ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return sgMail.send(msg);
};

/**
 * Send admin notification when a new user completes verification
 * @param {string} adminEmail - Admin email address
 * @param {Object} user - User object with details of the new verified user
 * @returns {Promise} - SendGrid API response
 */
export const sendAdminNotification = async (adminEmail, user) => {
  const msg = {
    to: adminEmail,
    from: VERIFIED_SENDER,
    subject: 'New User Verified on Quantum Balance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance Admin Notification</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">New User Verified</h3>
          <p>A new user has successfully verified their account on Quantum Balance.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Joined:</strong> ${new Date(user.joiningDate).toLocaleString()}</p>
          </div>
          <p>You can view the full user details in the admin dashboard.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return sgMail.send(msg);
};

/**
 * Send notifications to all admin emails
 * @param {Object} user - User object with details of the new verified user
 * @returns {Promise<Array>} - Array of promises from SendGrid API
 */
export const notifyAllAdmins = async (user) => {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  
  if (!adminEmails.length) {
    console.warn('No admin emails configured in .env');
    return [];
  }
  
  // Send emails one by one
  const promises = adminEmails.map(email => 
    sendAdminNotification(email.trim(), user)
  );
  
  return Promise.all(promises);
};

/**
 * Send scalar healing information request email to admins
 * @param {Object} formData - Form data from the scalar healing request
 * @returns {Promise} - SendGrid API response
 */
export const sendScalarHealingRequest = async (formData) => {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  
  if (!adminEmails.length) {
    console.warn('No admin emails configured in .env');
    return [];
  }
  
  const msg = {
    to: adminEmails[0], // Send to first admin as primary recipient
    cc: adminEmails.slice(1), // CC other admins if any
    from: VERIFIED_SENDER,
    subject: 'New Scalar Healing Information Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance - Scalar Healing Request</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">New Information Request</h3>
          <p>Someone has requested more information about Scalar Healing services.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${formData.message}</p>
          </div>
          <p>Please follow up with this request as soon as possible.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated message from your Quantum Balance website.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  // Also send confirmation to the user
  await sendScalarHealingConfirmation(formData.email, formData.name);
  
  return sgMail.send(msg);
};

/**
 * Send confirmation to user after scalar healing info request
 * @param {string} userEmail - User email address
 * @param {string} name - User's name
 * @returns {Promise} - SendGrid API response
 */
export const sendScalarHealingConfirmation = async (userEmail, name) => {
  const msg = {
    to: userEmail,
    from: VERIFIED_SENDER,
    subject: 'Thank You for Your Interest in Scalar Healing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">Hello ${name},</h3>
          <p>Thank you for your interest in our Scalar Healing services at Quantum Balance.</p>
          <p>We have received your request for information and will be in touch with you shortly.</p>
          <p>In the meantime, if you have any urgent questions, please don't hesitate to contact us directly at <a href="mailto:info@quantumbalance.co.uk">info@quantumbalance.co.uk</a>.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return sgMail.send(msg);
};

/**
 * Send payment confirmation email to user
 * @param {Object} user - User object
 * @param {Object} packageData - Package information
 * @param {Object} paymentInfo - Payment details
 * @returns {Promise} - SendGrid API response
 */
export const sendPaymentConfirmation = async (user, packageData, paymentInfo) => {
  const msg = {
    to: user.email,
    from: VERIFIED_SENDER,
    subject: 'Your Quantum Balance Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">Hello ${user.name},</h3>
          <h2 style="color: #27ae60;">Payment Successful!</h2>
          <p>Thank you for your purchase. Your payment has been processed successfully.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Package:</strong> ${packageData.name}</p>
            <p><strong>Amount:</strong> £${packageData.price.toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Transaction ID:</strong> ${paymentInfo.id}</p>
          </div>
          <p>Your package is now active and you can access all its features from your dashboard.</p>
          <p>If you have any questions about your purchase, please contact us at <a href="mailto:info@quantumbalance.co.uk">info@quantumbalance.co.uk</a>.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return sgMail.send(msg);
};

/**
 * Send notification to admins about new purchase
 * @param {Object} user - User who made the purchase
 * @param {Object} packageData - Package information
 * @param {Object} paymentInfo - Payment details
 * @returns {Promise} - SendGrid API response
 */
export const sendPaymentNotificationToAdmin = async (user, packageData, paymentInfo) => {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  
  if (!adminEmails.length) {
    console.warn('No admin emails configured in .env');
    return [];
  }
  
  const msg = {
    to: adminEmails[0], // Send to first admin as primary recipient
    cc: adminEmails.slice(1), // CC other admins if any
    from: VERIFIED_SENDER,
    subject: `New Package Purchase: ${packageData.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance - New Purchase</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">New Package Purchase</h3>
          <p>A user has purchased a package on Quantum Balance.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">User Details</h4>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>User ID:</strong> ${user._id}</p>
            
            <h4>Package Details</h4>
            <p><strong>Package:</strong> ${packageData.name}</p>
            <p><strong>Package Type:</strong> ${packageData.type}</p>
            <p><strong>Amount:</strong> £${packageData.price.toFixed(2)}</p>
            
            <h4>Payment Details</h4>
            <p><strong>Transaction ID:</strong> ${paymentInfo.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>You can view full details in the admin dashboard.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated notification from your Quantum Balance website.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return sgMail.send(msg);
};

/**
 * Send admin login verification email
 * @param {string} adminEmail - Admin's email address
 * @param {string} name - Admin's name
 * @param {string} verificationCode - The code to be sent
 * @returns {Promise} - SendGrid API response
 */
export const sendAdminLoginVerification = async (adminEmail, name, verificationCode) => {
  const msg = {
    to: adminEmail,
    from: VERIFIED_SENDER,
    subject: 'Admin Login Verification - Quantum Balance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance</h2>
          <p style="color: #e74c3c; font-weight: bold;">ADMIN SECURITY VERIFICATION</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50;">Hello ${name},</h3>
          <p>Someone is attempting to log in to your admin account. For security reasons, please verify this login attempt using the code below:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; color: #2c3e50; letter-spacing: 5px;">${verificationCode}</h2>
          </div>
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p><strong>If this wasn't you</strong>, please contact other administrators immediately as your account may be compromised.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated security message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return sgMail.send(msg);
};

/**
 * Notify all admins about an admin login with option to force logout all admins
 * @param {Object} adminUser - The admin who logged in
 * @param {string} logoutToken - Special token that can be used to force logout all admins
 * @returns {Promise<Array>} - Array of promises from SendGrid API
 */
export const notifyAdminLogin = async (adminUser, logoutToken) => {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  
  if (!adminEmails.length) {
    console.warn('No admin emails configured in .env');
    return [];
  }
  
  const logoutUrl = `${process.env.SITE_URL || 'https://quantumbalance.co.uk'}/api/auth/admin/logout-all/${logoutToken}`;
  
  const msg = {
    to: adminEmails[0], // Send to first admin as primary recipient
    cc: adminEmails.slice(1), // CC other admins if any
    from: VERIFIED_SENDER,
    subject: 'SECURITY ALERT: Admin Login Detected - Quantum Balance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50;">Quantum Balance Security Alert</h2>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="color: #e74c3c;">Admin Login Detected</h3>
          <p>An administrator has just logged into the Quantum Balance system.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Admin Name:</strong> ${adminUser.name}</p>
            <p><strong>Admin Email:</strong> ${adminUser.email}</p>
            <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>IP Address:</strong> [IP address unavailable in dummy implementation]</p>
          </div>
          <p>If this login was not authorized, you can immediately log out all admin sessions by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${logoutUrl}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">FORCE LOGOUT ALL ADMINS</a>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">This link will expire in 24 hours for security reasons.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d;">
          <p>This is an automated security message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return sgMail.send(msg);
};

export default {
  createCustomEmailTemplate,
  sendEmail,
  sendVerificationEmail,
  sendAdminNotification,
  notifyAllAdmins,
  sendScalarHealingRequest,
  sendScalarHealingConfirmation,
  sendPaymentConfirmation,
  sendPaymentNotificationToAdmin,
  sendAdminLoginVerification,
  notifyAdminLogin
}; 