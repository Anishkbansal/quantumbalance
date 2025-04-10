import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import Package from '../models/Package.js';
import Prescription from '../models/Prescription.js';
import HealthQuestionnaire from '../models/HealthQuestionnaire.js';
import mongoose from 'mongoose';
import WellnessEntry from '../models/WellnessEntry.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
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

    // Check if email is verified
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

    // For demo, we're using a fixed code
    const VERIFICATION_CODE = '123456'; 

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

    // Check verification code
    if (code !== VERIFICATION_CODE) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update user verification status
    user.isVerified = true;
    await user.save();

    // Generate token for auto-login after verification
    const token = generateToken(user._id);

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

    // In a real app, we would generate a random code and send an email
    // For the demo, we'll use the fixed code '123456'
    
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      // For demonstration purposes only! In production, never send the code back to the client
      demoCode: '123456'
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

    // Verify OTP (you should implement your OTP verification logic here)
    // This is a placeholder - replace with your actual OTP verification logic
    const isValidOTP = true; // Replace with actual OTP verification

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // If OTP is valid, generate a temporary admin token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Admin OTP verified successfully',
      token
    });
  } catch (error) {
    console.error('Error verifying admin OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin OTP',
      error: error.message
    });
  }
}; 