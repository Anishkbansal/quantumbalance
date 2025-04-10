import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import questionnaireRoutes from './routes/questionnaireRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import wellnessRoutes from './routes/wellnessRoutes.js';
import audioRoutes from './routes/audioRoutes.js';
import audioFilesRoutes from './routes/audioFiles.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import messageRoutes from './routes/messageRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import cron from 'node-cron';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './utils/aiPrescriptionService.js'; // Preload the AI service

// Get directory name (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate JWT token - same implementation as in authController
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Special handling for Stripe webhook route
// This needs to be before the json bodyParser middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Increase payload size limit for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'quantum_balance_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/audio-files', audioFilesRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stripe', stripeRoutes);

// Serve static files from the public directory
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // IMPORTANT: Always check for expired packages at startup
    console.log('Running startup check for expired packages...');
    try {
      const result = await checkAllPackagesExpiry();
      console.log(`Startup package check complete: ${result.expiredCount} expired packages processed`);
    } catch (error) {
      console.error('Error during startup package check:', error);
    }
    
    // Check all packages for expiry on server startup
    console.log('STARTUP: Running package expiry check...');
    try {
      const result = await checkAllPackagesExpiry();
      console.log(`STARTUP: Expired packages check complete. Found ${result.expiredCount} expired packages.`);
    } catch (error) {
      console.error('STARTUP: Error checking packages for expiry:', error);
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Schedule cleanup task for unverified users
      // Runs daily at midnight
      cron.schedule('0 0 * * *', async () => {
        try {
          console.log('Running scheduled cleanup of unverified users...');
          
          // Generate admin token for API call
          const token = generateToken(process.env.ADMIN_USER_ID);
          
          // Make a request to the cleanup endpoint
          const response = await axios.post('http://localhost:' + PORT + '/api/auth/admin/cleanup-users', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log(`Cleanup complete: ${response.data.message}`);
        } catch (error) {
          console.error('Error running cleanup task:', error);
        }
      });
      
      // Schedule task to check for packages eligible for renewal
      // Runs daily at 6 AM
      cron.schedule('0 6 * * *', async () => {
        try {
          console.log('Running package renewal eligibility check...');
          
          // Import models
          const UserPackage = mongoose.model('UserPackage');
          const User = mongoose.model('User');
          
          // Find all active packages
          const activePackages = await UserPackage.find({ isActive: true });
          
          // Check renewal eligibility for each package
          for (const userPackage of activePackages) {
            const isEligible = await userPackage.updateRenewalEligibility();
            
            // If eligible for renewal, notify the user
            // In a real production app, you would send an email or push notification here
            if (isEligible) {
              const user = await User.findById(userPackage.user);
              if (user) {
                console.log(`User ${user.email} is eligible to renew their ${userPackage.packageType} package`);
                
                // In production, you would send an email:
                /*
                await sendEmail({
                  to: user.email,
                  subject: 'Your Package is Ready for Renewal',
                  text: `Your ${userPackage.packageType} package is eligible for renewal. 
                         Log in to your account to renew and continue enjoying our services!`
                });
                */
              }
            }
          }
          
          console.log('Package renewal eligibility check complete');
        } catch (error) {
          console.error('Error checking package renewal eligibility:', error);
        }
      });
      
      // Schedule task to check packages expiry twice daily (11 AM and 11 PM IST)
      // 11 AM IST is 5:30 AM UTC, 11 PM IST is 5:30 PM UTC
      cron.schedule('30 5,17 * * *', async () => {
        try {
          console.log('Running scheduled check for expired packages...');
          await checkAllPackagesExpiry();
          console.log('Expired packages check complete');
        } catch (error) {
          console.error('Error checking expired packages:', error);
        }
      });
      
      // Schedule regular data cleanup (once a week on Sunday at 2 AM)
      cron.schedule('0 2 * * 0', async () => {
        try {
          console.log('Running weekly data cleanup...');
          
          // Generate admin token for API call
          const token = generateToken(process.env.ADMIN_USER_ID);
          
          // Cleanup inactive user packages older than 1 year
          await cleanupOldData();
          
          console.log('Weekly data cleanup complete');
        } catch (error) {
          console.error('Error during weekly data cleanup:', error);
        }
      });
      
      // Schedule wellness check reminders (runs at 9 AM every day)
      cron.schedule('0 9 * * *', async () => {
        try {
          console.log('Running daily wellness check reminders...');
          
          // Import models
          const User = mongoose.model('User');
          const WellnessEntry = mongoose.model('WellnessEntry');
          
          // Find all non-admin users with active packages and completed questionnaires
          const eligibleUsers = await User.find({
            isAdmin: false,
            packageType: { $ne: 'none' },
            activePackageId: { $ne: null },
            healthQuestionnaire: { $exists: true }
          });
          
          console.log(`Found ${eligibleUsers.length} users eligible for wellness reminders`);
          
          // Check each user if they need a wellness reminder
          for (const user of eligibleUsers) {
            try {
              // Check if package is expired
              const isExpired = await user.isPackageExpired();
              if (isExpired) continue;
              
              // Check if the user should be prompted
              const shouldPrompt = await WellnessEntry.shouldPromptUser(user._id);
              if (shouldPrompt) {
                console.log(`User ${user.email} should be prompted for wellness data`);
                
                // In a production app, you would send a notification or email here
                /*
                await sendEmail({
                  to: user.email,
                  subject: 'Daily Wellness Check-in',
                  text: 'It\'s time for your daily wellness check-in. Please log in to track your progress.'
                });
                */
              }
            } catch (err) {
              console.error(`Error processing wellness reminder for user ${user._id}:`, err);
            }
          }
          
          console.log('Daily wellness check reminders complete');
        } catch (error) {
          console.error('Error running wellness reminders:', error);
        }
      });
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Function to check all packages for expiry
async function checkAllPackagesExpiry() {
  try {
    console.log('Checking all packages for expiry...');
    
    const UserPackage = mongoose.model('UserPackage');
    const User = mongoose.model('User');
    
    // Get all active packages
    const activePackages = await UserPackage.find({ isActive: true });
    console.log(`Found ${activePackages.length} active packages to check for expiry`);
    
    let expiredCount = 0;
    let processedCount = 0;
    let errorCount = 0;
    
    // Check each package
    for (const userPackage of activePackages) {
      try {
        processedCount++;
        
        // Use the new isExpired method
        if (userPackage.isExpired()) {
          console.log(`EXPIRED: Package ${userPackage._id} (${userPackage.packageType}) expired, deactivating...`);
          expiredCount++;
          
          // Mark package as inactive
          userPackage.isActive = false;
          await userPackage.save();
          
          // Update user's package status
          const user = await User.findById(userPackage.user);
          if (user) {
            if (user.activePackageId && user.activePackageId.toString() === userPackage._id.toString()) {
              console.log(`Updating user ${user._id} (${user.email}) - Removing expired package reference`);
              user.packageType = 'none';
              user.activePackageId = null;
              await user.save();
              
              console.log(`Updated user ${user.email} package status to expired`);
            } else {
              console.log(`User ${user._id} has a different active package, no need to update user record`);
            }
          } else {
            console.log(`Warning: Package ${userPackage._id} has no associated user (user: ${userPackage.user})`);
          }
        }
      } catch (packageError) {
        errorCount++;
        console.error(`Error processing package ${userPackage._id}:`, packageError);
      }
    }
    
    console.log(`Expired packages check statistics:
  - Total active packages: ${activePackages.length}
  - Processed: ${processedCount}
  - Expired and deactivated: ${expiredCount}
  - Errors: ${errorCount}`);
    
    return { 
      totalPackages: activePackages.length,
      processedCount, 
      expiredCount,
      errorCount
    };
  } catch (error) {
    console.error('Error checking packages expiry:', error);
    throw error;
  }
}

// Function to clean up old data
async function cleanupOldData() {
  try {
    const UserPackage = mongoose.model('UserPackage');
    const HealthQuestionnaire = mongoose.model('HealthQuestionnaire');
    const Session = mongoose.model('Session');
    
    // Calculate date 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Delete inactive user packages older than 1 year
    const oldPackagesResult = await UserPackage.deleteMany({
      isActive: false,
      updatedAt: { $lt: oneYearAgo }
    });
    
    // Delete old health questionnaire history (keep only the 10 most recent per user)
    const users = await mongoose.model('User').find().select('_id');
    
    for (const user of users) {
      // Get all questionnaires for this user sorted by date
      const questionnaires = await HealthQuestionnaire.find({
        userId: user._id
      }).sort({ createdAt: -1 });
      
      // If user has more than 10 questionnaires, delete the oldest ones
      if (questionnaires.length > 10) {
        const toDelete = questionnaires.slice(10);
        for (const q of toDelete) {
          await HealthQuestionnaire.findByIdAndDelete(q._id);
        }
      }
    }
    
    // Clean up expired sessions (should be handled by TTL, but just in case)
    await Session.deleteMany({ createdAt: { $lt: oneYearAgo } });
    
    console.log(`Cleanup complete: Deleted ${oldPackagesResult.deletedCount} old packages.`);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    throw error;
  }
}

// Export the function for ES modules
export { checkAllPackagesExpiry }; 