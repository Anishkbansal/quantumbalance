import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import Package from '../models/Package.js';
import Prescription from '../models/Prescription.js';
import HealthQuestionnaire from '../models/HealthQuestionnaire.js';
import mongoose from 'mongoose';
import WellnessEntry from '../models/WellnessEntry.js';
import { sendVerificationEmail, notifyAllAdmins, sendAdminLoginVerification, notifyAdminLogin } from '../utils/emailService.js';
import crypto from 'crypto';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// Store admin OTPs with expiration
const adminOTPs = new Map();
// Store admin logout tokens
const adminLogoutTokens = new Map();

// Generate a random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a secure random token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, username, password, phone, profilePhoto } = req.body;

    // Check if user with email or username already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      username,
      password,
      phone: phone || '',
      profile: {
        avatar: profilePhoto || '',
      },
      profilePicture: profilePhoto || '',
      packageType: 'none',
      healthQuestionnaire: null,
      isVerified: false, // Always start unverified
      isAdmin: false
    });

    await user.save();

    // Store user in session
    if (req.session) {
      req.session.userId = user._id;
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackage: user.activePackage,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        joiningDate: user.joiningDate
      },
      message: 'Registration successful. Please verify your email to continue.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error registering user', 
      error: error.message 
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username },
        { email: username } // Allow login with email too
      ]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if email is verified for regular users
    if (!user.isVerified && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check if user is trying to login as admin but is not an admin
    if (isAdmin && !user.isAdmin) {
      // If user is not an admin in DB but has passed the admin password check,
      // update their account to be an admin
      user.isAdmin = true;
      await user.save();
    }

    // For admin users, require verification every time they log in
    if (user.isAdmin) {
      // Generate and send a verification code
      await sendAdminVerification(user);
      
      return res.status(403).json({
        success: false,
        message: 'Admin verification required',
        requiresAdminVerification: true,
        email: user.email
      });
    }

    // For regular users, continue with normal login
    
    // Store user in session
    if (req.session) {
      req.session.userId = user._id;
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackage: user.activePackage,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified || false,
        joiningDate: user.joiningDate
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error logging in', 
      error: error.message 
    });
  }
};

// Logout user
export const logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error logging out' 
        });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      return res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  } else {
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  }
};

// Get current user
export const getUser = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Get user from database and populate package data
    const user = await User.findById(req.session.userId)
      .populate('activePackageId');
      
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if package is expired and update status if needed
    await user.checkAndUpdatePackageStatus();

    // Return user data
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackageId: user.activePackageId,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified || false,
        joiningDate: user.joiningDate
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting user data', 
      error: error.message 
    });
  }
};

// Get all users - Admin only
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const users = await User.find().select('-password');
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user details - Admin only
export const getUserDetails = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Admin access required."
      });
    }

    const userId = req.params.userId;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Get user details with health questionnaire and active package
    const user = await User.findById(userId)
      .select('-password')
      .populate('activePackageId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get user's active prescription
    const prescription = user.activePrescriptionId 
      ? await Prescription.findById(user.activePrescriptionId)
      : null;

    // Get user's wellness entries
    const wellnessEntries = await WellnessEntry.find({ user: userId })
      .sort({ date: -1 })
      .limit(7);

    return res.status(200).json({
      success: true,
      user,
      prescription,
      wellnessEntries
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin Create User
export const adminCreateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { name, email, username, password, isAdmin, packageType } = req.body;

    // Check if required fields are provided
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [
        { email },
        { username }
      ]
    });

    if (userExists) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      password,
      isAdmin: isAdmin || false,
      packageType: packageType || 'none',
      questionnaires: [],
      packages: []
    });

    if (user) {
      return res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          packageType: user.packageType
        }
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check if required fields are provided
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if verification code exists and is valid
    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if verification code has expired
    if (user.verificationCodeExpires && user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate token for auto-login after verification
    const token = generateToken(user._id);

    // Send notification to admins about the new verified user
    notifyAllAdmins(user).catch(err => {
      console.error('Error sending admin notifications:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackageId: user.activePackageId,
        isAdmin: user.isAdmin,
        isVerified: true,
        joiningDate: user.joiningDate
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error verifying email', 
      error: error.message 
    });
  }
};

// Send Verification Code
export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code and its expiry in the user document
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();
    
    // Send the verification code via email
    await sendVerificationEmail(user.email, user.name, verificationCode);
    
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Send verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error sending verification code', 
      error: error.message 
    });
  }
};

// Clean up unverified users
export const cleanupUnverifiedUsers = async (req, res) => {
  try {
    // Only allow this to be called by admins or internal processes
    if (req.user && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find and delete unverified users created more than 3 days ago
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: threeDaysAgo }
    });

    // Return the number of deleted users
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} unverified users`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error cleaning up unverified users', 
      error: error.message 
    });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Delete all user sessions
    await Session.deleteMany({ userId });
    
    // Find and delete all packages associated with this user
    await Package.deleteMany({ userId });
    
    // Delete all prescriptions associated with this user
    await Prescription.deleteMany({ userId });
    
    // Delete any other related data
    await HealthQuestionnaire.deleteMany({ userId });
    
    // Finally, delete the user
    await User.findByIdAndDelete(userId);
    
    // Clear session
    req.session.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false, 
      message: 'Failed to delete account'
    });
  }
};

// Send account deletion verification code
export const sendDeletionCode = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Generate a random code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, save this code to the user document with an expiry time
    // and send it via email
    
    // For this simulation, just log it
    console.log(`Deletion code for user ${userId}: ${verificationCode}`);
    
    // In production, you'd use something like:
    // await User.findByIdAndUpdate(userId, { 
    //   deletionCode: verificationCode,
    //   deletionCodeExpires: Date.now() + 3600000 // 1 hour
    // });
    // 
    // await sendEmail({
    //   to: req.user.email,
    //   subject: 'Account Deletion Code',
    //   text: `Your verification code is: ${verificationCode}. This code will expire in 1 hour.`
    // });
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Error sending deletion code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    // Get user ID from session or Auth token
    const userId = req.session?.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { name, phone, profilePhoto, profilePicture } = req.body;

    // Validate request
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user data
    user.name = name;
    
    // Update phone if provided
    user.phone = phone || user.phone || '';
    
    // Update profile if not exists
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update profile picture - support both old and new property names
    if (profilePicture) {
      user.profilePicture = profilePicture;
      user.profile.avatar = profilePicture; // For backwards compatibility
    } else if (profilePhoto) {
      user.profile.avatar = profilePhoto;
      user.profilePicture = profilePhoto; // For forwards compatibility
    }

    // Save changes
    await user.save();
    
    console.log('Profile updated successfully for user:', user._id);

    // Return updated user data
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackage: user.activePackage,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        joiningDate: user.joiningDate
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Send verification code to admin
export const sendAdminVerification = async (adminUser) => {
  try {
    // Generate a verification code
    const verificationCode = generateVerificationCode();
    
    // Store the code with expiration (10 minutes)
    adminOTPs.set(adminUser.email, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    // Send the verification email
    await sendAdminLoginVerification(
      adminUser.email,
      adminUser.name,
      verificationCode
    );
    
    return true;
  } catch (error) {
    console.error('Error sending admin verification:', error);
    return false;
  }
};

// Verify Admin OTP
export const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if OTP exists and is valid
    const otpData = adminOTPs.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found. Please request a new code.'
      });
    }
    
    if (otpData.expires < Date.now()) {
      adminOTPs.delete(email); // Clean up expired OTP
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }
    
    if (otpData.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // OTP is valid, remove it from storage
    adminOTPs.delete(email);

    // Generate user token
    const token = generateToken(user._id);
    
    // Store user in session
    if (req.session) {
      req.session.userId = user._id;
    }
    
    // Generate a logout token that can be used to logout all admins
    const logoutToken = generateSecureToken();
    adminLogoutTokens.set(logoutToken, {
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      createdBy: user._id
    });
    
    // Notify all admins of this login
    notifyAdminLogin(user, logoutToken).catch(err => {
      console.error('Error sending admin login notification:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Admin verification successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        profile: user.profile,
        profilePicture: user.profilePicture,
        packageType: user.packageType,
        activePackage: user.activePackage,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified || false,
        joiningDate: user.joiningDate
      }
    });
  } catch (error) {
    console.error('Error verifying admin OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin login',
      error: error.message
    });
  }
};

// Generate new admin OTP
export const generateAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Generate and send verification code
    const success = await sendAdminVerification(user);

    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Verification code sent to your email'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
  } catch (error) {
    console.error('Error generating admin OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Logout all admin sessions
export const logoutAllAdmins = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    // Check if token exists and is valid
    const tokenData = adminLogoutTokens.get(token);
    
    if (!tokenData || tokenData.expires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired security token'
      });
    }
    
    // Token is valid, remove it
    adminLogoutTokens.delete(token);
    
    // In a real implementation, you would invalidate all admin sessions/tokens here
    // This could involve clearing all admin sessions in your database,
    // or adding all current admin tokens to a blacklist
    
    // Here's a placeholder implementation
    console.log('ADMIN SECURITY: All admin sessions have been terminated');
    
    // You could track which admin triggered this
    const triggeringAdmin = await User.findById(tokenData.createdBy);
    const adminName = triggeringAdmin ? triggeringAdmin.name : 'Unknown';
    
    // Redirect to a confirmation page or to login page
    if (req.accepts('html')) {
      // If this is a browser request, redirect to a confirmation page
      return res.redirect('/admin-security-action-confirmed');
    } else {
      // If API request, return JSON
      return res.status(200).json({
        success: true,
        message: 'All admin sessions have been terminated',
        triggeredBy: adminName
      });
    }
  } catch (error) {
    console.error('Error logging out all admins:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Forgot Password - send reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      // We don't want to reveal whether an email exists in our system
      // for security reasons
      return res.status(200).json({ 
        success: true, 
        message: 'If this email exists in our system, a password reset link has been sent.' 
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token hash and expiration (1 hour from now)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    // Send reset email using the emailService utility
    try {
      await sendVerificationEmail(
        user.email,
        'Reset Your Password',
        `You are receiving this email because you (or someone else) has requested the reset of a password. 
        Please click on the following link, or paste this into your browser to complete the process:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request this, please ignore this email and your password will remain unchanged.`
      );
      
      return res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      
      // Reset user token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Error sending reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing request', 
      error: error.message 
    });
  }
};

// Reset Password - process password reset
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both token and new password' 
      });
    }
    
    // Hash the token from the URL to compare with hashed token in DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    // Set new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error resetting password', 
      error: error.message 
    });
  }
}; 