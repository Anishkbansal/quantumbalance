import Package from '../models/Package.js';
import UserPackage from '../models/UserPackage.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { checkAllPackagesExpiry } from '../server.js';
import { generateAIPrescription } from '../utils/prescriptionService.js';
import Prescription from '../models/Prescription.js';

// Get all available packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    
    return res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error getting packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving packages',
      error: error.message
    });
  }
};

// Get a single package by ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package_ = await Package.findById(id);
    
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: package_
    });
  } catch (error) {
    console.error('Error getting package:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving package',
      error: error.message
    });
  }
};

// Purchase a package
const purchasePackage = async (req, res) => {
  try {
    const { packageId, paymentMethod, paymentId, currency } = req.body;
    const userId = req.user._id;
    
    // Add warning and validation for Stripe payments
    if (paymentMethod === 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'Stripe payments should use the /api/stripe/confirm-payment endpoint to ensure payment verification'
      });
    }
    
    // Validate input
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }
    
    // Find the package
    const package_ = await Package.findById(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has an active package
    // As a precaution, find and update any previous package records
    if (user.packageType !== 'none' && user.activePackageId) {
      console.log(`User ${userId} already has an active package. Cleaning up before assigning new package.`);
      
      // Set previous packages to inactive
      await UserPackage.updateMany(
        { user: userId, isActive: true },
        { isActive: false }
      );
    }
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + package_.durationDays);
    
    // Map payment method to valid enum value
    const validPaymentMethod = paymentMethod === 'stripe' ? 'credit_card' : (paymentMethod || 'credit_card');
    
    // If currency is provided, update user's preferred currency
    if (currency) {
      const validCurrencies = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'INR'];
      if (validCurrencies.includes(currency)) {
        user.preferredCurrency = currency;
      }
    }
    
    // Create a new user package
    const userPackage = new UserPackage({
      user: userId,
      package: packageId,
      packageType: package_.type,
      expiryDate,
      price: package_.price,
      currency: currency || 'GBP', // Store the currency used for the purchase
      paymentMethod: validPaymentMethod,
      paymentId: paymentId || `demo_${Date.now()}`,
      stripePaymentIntentId: paymentMethod === 'stripe' ? paymentId : null,
      paymentStatus: 'completed',
      isActive: true
    });
    
    await userPackage.save();
    
    // Update user's package type and reference to active package
    user.packageType = package_.type;
    user.activePackageId = userPackage._id;
    
    // If user has a questionnaire, update the selectedPackage info
    if (user.healthQuestionnaire) {
      user.healthQuestionnaire.selectedPackage = {
        packageId: packageId,
        packageType: package_.type
      };
    }
    
    await user.save();
    
    // Generate prescription if user has filled out a health questionnaire
    let prescriptionResult = null;
    if (user.healthQuestionnaire) {
      try {
        console.log(`Generating AI prescription for user ${userId} after package purchase...`);
        prescriptionResult = await generateAIPrescription(userId);
        
        if (prescriptionResult.success) {
          console.log(`********** AI PRESCRIPTION GENERATED AFTER PACKAGE PURCHASE **********`);
          console.log(`Generated prescription ID: ${prescriptionResult.prescription._id}`);
          console.log(`For user: ${userId}`);
          console.log(`Package type: ${package_.type}`);
          console.log(`Number of frequencies: ${prescriptionResult.prescription.frequencies.length}`);
        } else {
          console.error(`Failed to generate AI prescription for user ${userId}:`, prescriptionResult.message);
        }
      } catch (prescriptionError) {
        console.error(`Error generating AI prescription for user ${userId}:`, prescriptionError);
      }
    } else {
      console.log(`User ${userId} has no health questionnaire. No AI prescription generated.`);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Package purchased successfully',
      data: {
        package: package_,
        userPackage: userPackage,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          packageType: user.packageType,
          activePackageId: user.activePackageId
        },
        prescription: prescriptionResult?.success ? {
          generated: true,
          id: prescriptionResult.prescription._id
        } : {
          generated: false
        }
      }
    });
  } catch (error) {
    console.error('Error purchasing package:', error);
    return res.status(500).json({
      success: false,
      message: 'Error purchasing package',
      error: error.message
    });
  }
};

// Get user's active packages
const getUserPackages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const userPackages = await UserPackage.find({ user: userId })
      .populate('package')
      .sort({ createdAt: -1 });
    
    const activePackages = userPackages.filter(pkg => pkg.isActive);
    const expiredPackages = userPackages.filter(pkg => !pkg.isActive);
    
    return res.status(200).json({
      success: true,
      data: {
        active: activePackages,
        expired: expiredPackages,
        all: userPackages
      }
    });
  } catch (error) {
    console.error('Error getting user packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user packages',
      error: error.message
    });
  }
};

// Redeem a gift code
const redeemGiftCode = async (req, res) => {
  try {
    const { giftCode } = req.body;
    const userId = req.user._id;
    
    if (!giftCode) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is required'
      });
    }
    
    // Find the gift package
    const giftPackage = await UserPackage.findOne({ 
      giftCode,
      isGift: true,
      user: null // Gift code hasn't been claimed yet
    }).populate('package');
    
    if (!giftPackage) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already claimed gift code'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user already has an active package
    // As a precaution, find and update any previous package records
    if (user.packageType !== 'none' && user.activePackageId) {
      console.log(`User ${userId} already has an active package. Cleaning up before assigning new package from gift code.`);
      
      // Set previous packages to inactive
      await UserPackage.updateMany(
        { user: userId, isActive: true, isGift: false }, // Don't include other gift codes
        { isActive: false }
      );
    }
    
    // Update the gift package with the user's ID
    giftPackage.user = userId;
    giftPackage.isActive = true;
    
    await giftPackage.save();
    
    // Update user's package type and reference to active package
    user.packageType = giftPackage.packageType;
    user.activePackageId = giftPackage._id;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Gift code redeemed successfully',
      data: {
        package: giftPackage.package,
        userPackage: giftPackage,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          packageType: user.packageType,
          activePackageId: user.activePackageId
        }
      }
    });
  } catch (error) {
    console.error('Error redeeming gift code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error redeeming gift code',
      error: error.message
    });
  }
};

// Create a gift code
const createGiftCode = async (req, res) => {
  try {
    const { packageId, expiryDays } = req.body;
    
    // Validate input
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }
    
    // Find the package
    const package_ = await Package.findById(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    // Generate a unique gift code
    const giftCode = generateGiftCode();
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || package_.durationDays));
    
    // Create a new user package as a gift
    const userPackage = new UserPackage({
      user: null, // Will be assigned when redeemed
      package: packageId,
      packageType: package_.type,
      expiryDate,
      price: package_.price,
      paymentStatus: 'completed',
      stripePaymentIntentId: null,
      isGift: true,
      giftCode,
      isActive: false // Will be activated when redeemed
    });
    
    await userPackage.save();
    
    return res.status(201).json({
      success: true,
      message: 'Gift code created successfully',
      data: {
        package: package_,
        userPackage: userPackage,
        giftCode
      }
    });
  } catch (error) {
    console.error('Error creating gift code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating gift code',
      error: error.message
    });
  }
};

// Helper function to generate a unique gift code
const generateGiftCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed easily confused characters
  let code = '';
  
  // Generate 8-character code
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  // Add dashes for readability (format: XXXX-XXXX)
  return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
};

// Admin: Create a new package
const createPackage = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized. Admin access required.' 
      });
    }
    
    const { name, type, price, description, features, durationDays, maxPrescriptions } = req.body;
    
    // Validate required fields
    if (!name || !type || !price || !durationDays) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create the package
    const newPackage = new Package({
      name,
      type,
      price,
      description: description || '',
      features: features || [],
      durationDays,
      maxPrescriptions: maxPrescriptions || 0
    });
    
    await newPackage.save();
    
    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating package',
      error: error.message
    });
  }
};

// Check package expiry and update status
const checkPackageExpiry = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user has no active package, nothing to check
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(200).json({
        success: true,
        message: 'No active package to check',
        updated: false,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          packageType: user.packageType,
          activePackageId: user.activePackageId
        }
      });
    }
    
    // Find the active user package
    const userPackage = await UserPackage.findById(user.activePackageId);
    
    if (!userPackage || !userPackage.expiryDate) {
      // Invalid reference - reset user
      user.packageType = 'none';
      user.activePackageId = null;
      await user.save();
      
      console.log(`Cleaned up invalid package reference for user ${user._id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Invalid package reference, user updated',
        updated: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          packageType: 'none',
          activePackageId: null
        }
      });
    }
    
    // Check if package is expired
    const now = new Date();
    const expiryDate = new Date(userPackage.expiryDate);
    
    let updated = false;
    
    if (now > expiryDate) {
      console.log(`Package expired for user ${userId}. Cleaning up package references.`);
      
      // Update user's package status
      user.packageType = 'none';
      user.activePackageId = null;
      
      // Set package to inactive
      userPackage.isActive = false;
      
      // Save both the user and package changes
      await Promise.all([
        user.save(),
        userPackage.save()
      ]);
      
      updated = true;
      console.log(`Successfully cleaned up expired package for user ${userId}`);
    }
    
    // Fetch package details to include in response
    const packageInfo = updated ? null : await Package.findById(userPackage.package);
    
    return res.status(200).json({
      success: true,
      message: updated ? 'Package expired and status updated' : 'Package still active',
      updated,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        packageType: user.packageType,
        activePackageId: user.activePackageId
      },
      packageInfo: updated ? null : {
        expiryDate: userPackage.expiryDate,
        name: packageInfo?.name || userPackage.packageType,
        type: userPackage.packageType
      }
    });
  } catch (error) {
    console.error('Error checking package expiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking package expiry',
      error: error.message
    });
  }
};

// Get user's active package details
const getUserActivePackage = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user has no active package
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(200).json({
        success: false,
        message: 'No active package'
      });
    }
    
    // Get user's active package from UserPackage collection
    const userPackage = await UserPackage.findById(user.activePackageId)
      .populate('package');
      
    if (!userPackage) {
      // Invalid reference - reset user
      user.packageType = 'none';
      user.activePackageId = null;
      await user.save();
      
      return res.status(200).json({
        success: false,
        message: 'Invalid package reference'
      });
    }
    
    // Check if package is expired
    const now = new Date();
    const expiryDate = new Date(userPackage.expiryDate);
    const isExpired = now > expiryDate;
    
    if (isExpired) {
      // Package is expired - update user status
      user.packageType = 'none';
      user.activePackageId = null;
      
      // Mark UserPackage as inactive
      userPackage.isActive = false;
      
      await Promise.all([user.save(), userPackage.save()]);
      
      return res.status(200).json({
        success: false,
        message: 'Package has expired',
        packageInfo: {
          _id: userPackage.package._id,
          name: userPackage.package.name,
          packageType: userPackage.packageType,
          expiryDate: userPackage.expiryDate
        }
      });
    }
    
    // Check renewal eligibility
    await userPackage.updateRenewalEligibility();
    
    // Calculate time remaining
    const diffTime = Math.abs(expiryDate - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    // Format expiry date
    const formattedDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format renewal eligible date if available
    let formattedRenewalDate = null;
    if (userPackage.renewalEligibleDate) {
      formattedRenewalDate = new Date(userPackage.renewalEligibleDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return res.status(200).json({
      success: true,
      packageInfo: {
        _id: userPackage.package._id,
        name: userPackage.package.name,
        description: userPackage.package.description,
        packageType: userPackage.packageType,
        price: userPackage.package.price,
        features: userPackage.package.features,
        expiryDate: userPackage.expiryDate
      },
      timeRemaining: {
        days: diffDays,
        hours: diffHours,
        formattedDate
      },
      renewal: {
        isEligible: userPackage.isRenewalEligible,
        eligibleDate: userPackage.renewalEligibleDate,
        formattedEligibleDate: formattedRenewalDate
      }
    });
    
  } catch (error) {
    console.error('Error fetching active package:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active package',
      error: error.message
    });
  }
};

// Check if user's package is eligible for renewal (1.5 days before expiry)
const checkRenewalEligibility = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user has no active package, nothing to renew
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(200).json({
        success: true,
        isEligible: false,
        message: 'No active package to renew'
      });
    }
    
    // Get active package
    const userPackage = await UserPackage.findById(user.activePackageId)
      .populate('package');
      
    if (!userPackage) {
      return res.status(200).json({
        success: true,
        isEligible: false,
        message: 'Package not found'
      });
    }
    
    // Check if package is eligible for renewal - this uses the 1.5 days check
    const isEligible = userPackage.checkRenewalEligibility();
    userPackage.isRenewalEligible = isEligible;
    await userPackage.save();
    
    // Calculate days remaining until expiry
    const now = new Date();
    const expiryDate = new Date(userPackage.expiryDate);
    const diffTime = Math.abs(expiryDate - now);
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Get all available packages for renewal options
    const availablePackages = await Package.find({ isActive: true });
    
    // Log detailed renewal information to help debug
    console.log(`User ${userId}: Package expires ${expiryDate}, Renewal eligible: ${isEligible}, Days remaining: ${daysRemaining}`);
    
    return res.status(200).json({
      success: true,
      isEligible: isEligible,
      message: isEligible ? 'Package is eligible for renewal' : 'Package is not eligible for renewal yet',
      currentPackage: {
        _id: userPackage._id,
        type: userPackage.packageType,
        name: userPackage.package?.name || userPackage.packageType,
        expiryDate: userPackage.expiryDate,
        daysRemaining,
        renewalEligibleDate: userPackage.renewalEligibleDate
      },
      renewalOptions: availablePackages.map(pkg => ({
        _id: pkg._id,
        name: pkg.name,
        type: pkg.type,
        price: pkg.price,
        durationDays: pkg.durationDays,
        features: pkg.features,
        period: getPackagePeriod(pkg.durationDays, pkg.type)
      }))
    });
  } catch (error) {
    console.error('Error checking renewal eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking renewal eligibility',
      error: error.message
    });
  }
};

// Helper function to get package period text
function getPackagePeriod(durationDays, type) {
  if (type === 'single') return 'one-time payment';
  if (durationDays <= 7) return 'weekly';
  if (durationDays <= 15) return 'for 15 days';
  if (durationDays <= 31) return 'per month';
  if (durationDays <= 90) return 'per quarter';
  return 'per year';
}

// Renew package (either same package or upgrade/downgrade)
const renewPackage = async (req, res) => {
  try {
    const { newPackageId, paymentMethod, paymentId } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!newPackageId) {
      return res.status(400).json({
        success: false,
        message: 'New package ID is required'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user has no active package, redirect to regular purchase
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(400).json({
        success: false,
        message: 'No active package to renew. Please purchase a new package instead.',
        shouldPurchaseNew: true
      });
    }
    
    // Get the current package
    const currentUserPackage = await UserPackage.findById(user.activePackageId);
    if (!currentUserPackage) {
      return res.status(404).json({
        success: false,
        message: 'Current package not found'
      });
    }
    
    // Check if the package is eligible for renewal
    await currentUserPackage.updateRenewalEligibility();
    if (!currentUserPackage.isRenewalEligible) {
      return res.status(400).json({
        success: false,
        message: 'Package is not eligible for renewal yet.',
        renewalEligibleDate: currentUserPackage.renewalEligibleDate
      });
    }
    
    // Get the new package
    const newPackage = await Package.findById(newPackageId);
    if (!newPackage) {
      return res.status(404).json({
        success: false,
        message: 'New package not found'
      });
    }
    
    // Store whether this is a package type change (upgrade/downgrade)
    const isPackageTypeChange = currentUserPackage.packageType !== newPackage.type;
    
    // Calculate new expiry date based on current expiry date
    // This ensures the user doesn't lose any remaining time
    const currentExpiryDate = new Date(currentUserPackage.expiryDate);
    const now = new Date();
    let newExpiryDate;
    
    // If the current package has already expired, start from now
    if (currentExpiryDate < now) {
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + newPackage.durationDays);
    } else {
      // Otherwise, add the new duration to the current expiry date
      newExpiryDate = new Date(currentExpiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + newPackage.durationDays);
    }
    
    // Add entry to renewal history
    const renewalHistory = new RenewalHistory({
      user: userId,
      previousPackage: {
        packageId: currentUserPackage.package,
        packageType: currentUserPackage.packageType,
        expiryDate: currentUserPackage.expiryDate
      },
      newPackage: {
        packageId: newPackageId,
        packageType: newPackage.type,
        expiryDate: newExpiryDate
      },
      renewalDate: new Date()
    });
    
    await renewalHistory.save();
    
    // Mark the current package as inactive
    currentUserPackage.isActive = false;
    currentUserPackage.renewedToPackageId = renewalHistory._id;
    await currentUserPackage.save();
    
    // Create a new package instance for the user
    const userPackage = new UserPackage({
      user: userId,
      package: newPackageId,
      packageType: newPackage.type,
      purchaseDate: new Date(),
      expiryDate: newExpiryDate,
      price: newPackage.price,
      paymentMethod: paymentMethod || 'credit_card',
      paymentId: paymentId || `renewal_${Date.now()}`,
      paymentStatus: 'completed',
      isActive: true,
      renewedFromPackageId: currentUserPackage._id
    });
    
    await userPackage.save();
    
    // Update user's package type and reference
    user.packageType = newPackage.type;
    user.activePackageId = userPackage._id;
    
    // Check if the health questionnaire has been updated recently
    // Get the latest questionnaire history entry
    const latestQuestionnaireUpdate = await QuestionnaireHistory.findOne({ 
      user: userId 
    }).sort({ createdAt: -1 }).limit(1);
    
    // Determine if we need to generate a new prescription
    let shouldGenerateNewPrescription = false;
    let prescriptionResult = null;
    
    // Generate new prescription if:
    // 1. The package type has changed (upgrade/downgrade)
    // 2. The user has updated their questionnaire since the last prescription
    if (isPackageTypeChange) {
      console.log(`Package type changed from ${currentUserPackage.packageType} to ${newPackage.type}. Generating new prescription.`);
      shouldGenerateNewPrescription = true;
    } else if (latestQuestionnaireUpdate) {
      // Get the last prescription created for this user
      const lastPrescription = await Prescription.findOne({ 
        user: userId 
      }).sort({ createdAt: -1 }).limit(1);
      
      if (lastPrescription && latestQuestionnaireUpdate.createdAt > lastPrescription.createdAt) {
        console.log(`Questionnaire updated on ${latestQuestionnaireUpdate.createdAt} after last prescription created on ${lastPrescription.createdAt}. Generating new prescription.`);
        shouldGenerateNewPrescription = true;
      } else {
        console.log(`No questionnaire updates since last prescription. Keeping existing prescription.`);
      }
    }
    
    // Generate a new prescription if needed
    if (shouldGenerateNewPrescription && user.healthQuestionnaire) {
      prescriptionResult = await generateAIPrescription(userId);
      
      if (prescriptionResult.success) {
        console.log(`New prescription generated successfully for package renewal. ID: ${prescriptionResult.prescription._id}`);
      } else {
        console.error(`Failed to generate new prescription during renewal: ${prescriptionResult.message}`);
      }
    } else {
      console.log(`No new prescription generated for this renewal. Using existing prescription.`);
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Package renewed successfully',
      data: {
        userPackage,
        expiryDate: newExpiryDate,
        packageType: newPackage.type,
        newPrescriptionGenerated: shouldGenerateNewPrescription && prescriptionResult?.success,
        prescription: prescriptionResult?.success ? {
          id: prescriptionResult.prescription._id
        } : null
      }
    });
  } catch (error) {
    console.error('Error renewing package:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error renewing package'
    });
  }
};

// Get renewal history for a user
const getRenewalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all user packages ordered by date
    const userPackages = await UserPackage.find({ user: userId })
      .populate('package')
      .populate('renewedFromPackageId')
      .populate('renewedToPackageId')
      .sort({ createdAt: -1 });
    
    // Transform the data to show renewal chains
    const renewalChains = [];
    const processedIds = new Set();
    
    for (const pkg of userPackages) {
      if (processedIds.has(pkg._id.toString())) continue;
      
      let currentPkg = pkg;
      const chain = [currentPkg];
      processedIds.add(currentPkg._id.toString());
      
      // Follow the renewal chain backward
      while (currentPkg.renewedFromPackageId) {
        const fromId = currentPkg.renewedFromPackageId._id || currentPkg.renewedFromPackageId;
        const prevPkg = userPackages.find(p => p._id.toString() === fromId.toString());
        if (prevPkg && !processedIds.has(prevPkg._id.toString())) {
          chain.unshift(prevPkg);
          processedIds.add(prevPkg._id.toString());
          currentPkg = prevPkg;
        } else {
          break;
        }
      }
      
      // Follow the renewal chain forward
      currentPkg = pkg;
      while (currentPkg.renewedToPackageId) {
        const toId = currentPkg.renewedToPackageId._id || currentPkg.renewedToPackageId;
        const nextPkg = userPackages.find(p => p._id.toString() === toId.toString());
        if (nextPkg && !processedIds.has(nextPkg._id.toString())) {
          chain.push(nextPkg);
          processedIds.add(nextPkg._id.toString());
          currentPkg = nextPkg;
        } else {
          break;
        }
      }
      
      if (chain.length > 0) {
        renewalChains.push(chain);
      }
    }
    
    return res.status(200).json({
      success: true,
      renewalHistory: renewalChains.map(chain => ({
        packages: chain.map(pkg => ({
          _id: pkg._id,
          packageName: pkg.package?.name || pkg.packageType,
          packageType: pkg.packageType,
          purchaseDate: pkg.purchaseDate,
          expiryDate: pkg.expiryDate,
          price: pkg.price,
          isActive: pkg.isActive,
          wasRenewal: !!pkg.renewedFromPackageId
        }))
      }))
    });
  } catch (error) {
    console.error('Error getting renewal history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting renewal history',
      error: error.message
    });
  }
};

// Test function to manually check for expired packages
const testExpiredPackages = async (req, res) => {
  try {
    console.log('Running manual test for expired packages...');
    
    // Get all packages (both active and inactive)
    const allPackages = await UserPackage.find();
    
    const results = {
      total: allPackages.length,
      activeCount: 0,
      inactiveCount: 0,
      shouldBeExpired: 0,
      actuallyExpired: 0,
      anomalies: []
    };
    
    // Current date for comparison
    const now = new Date();
    
    // Check each package
    for (const userPackage of allPackages) {
      // Count active vs inactive
      if (userPackage.isActive) {
        results.activeCount++;
      } else {
        results.inactiveCount++;
      }
      
      // Check if package should be expired
      const expiryDate = new Date(userPackage.expiryDate);
      const shouldBeExpired = now > expiryDate;
      
      if (shouldBeExpired) {
        results.shouldBeExpired++;
        
        // If it should be expired, but is still active, log the anomaly
        if (userPackage.isActive) {
          console.log(`ANOMALY: Package ${userPackage._id} has expired on ${expiryDate.toISOString()} but is still active`);
          
          results.anomalies.push({
            packageId: userPackage._id,
            packageType: userPackage.packageType,
            expiryDate: userPackage.expiryDate,
            isActive: userPackage.isActive,
            user: userPackage.user
          });
        } else {
          results.actuallyExpired++;
        }
      }
    }
    
    // Run the cleanup function explicitly
    const cleanupResult = await checkAllPackagesExpiry();
    
    // Return detailed results
    return res.status(200).json({
      success: true,
      message: 'Manual package expiry check completed',
      results,
      cleanupResult
    });
  } catch (error) {
    console.error('Error in test expired packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing expired packages',
      error: error.message
    });
  }
};

// Function to manually check all packages - for testing expiry system
const forceCheckExpiredPackages = async (req, res) => {
  try {
    console.log('ADMIN REQUEST: Manually checking packages for expiry');
    
    // Get all packages regardless of status
    const allPackages = await UserPackage.find({});
    
    // Set up response data
    const results = {
      totalPackages: allPackages.length,
      activeCount: 0,
      inactiveCount: 0,
      shouldBeExpired: 0,
      actuallyExpired: 0,
      anomalies: []
    };
    
    const now = new Date();
    
    // First pass - analyze package states
    for (const pkg of allPackages) {
      if (pkg.isActive) {
        results.activeCount++;
      } else {
        results.inactiveCount++;
      }
      
      if (pkg.expiryDate) {
        const expiryDate = new Date(pkg.expiryDate);
        
        // Convert to local time for logging
        const expiredAgo = Math.round((now - expiryDate) / (1000 * 60 * 60));
        
        console.log(`Package ${pkg._id} (${pkg.packageType}): Expires ${expiryDate.toISOString()}, Status: ${pkg.isActive ? 'ACTIVE' : 'inactive'}, Expired: ${now > expiryDate ? `YES (${expiredAgo} hours ago)` : 'no'}`);
        
        // Check if package should be expired
        if (now > expiryDate) {
          results.shouldBeExpired++;
          
          // Check for anomaly - expired but still active
          if (pkg.isActive) {
            results.anomalies.push({
              packageId: pkg._id,
              packageType: pkg.packageType,
              expiryDate: pkg.expiryDate,
              userId: pkg.user,
              hoursExpired: expiredAgo
            });
          } else {
            results.actuallyExpired++;
          }
        }
      } else {
        console.log(`Package ${pkg._id} (${pkg.packageType}): NO EXPIRY DATE, Status: ${pkg.isActive ? 'ACTIVE' : 'inactive'}`);
        
        // A package without expiry date that's active is an anomaly
        if (pkg.isActive) {
          results.anomalies.push({
            packageId: pkg._id,
            packageType: pkg.packageType,
            expiryDate: 'MISSING',
            userId: pkg.user,
            issue: 'No expiry date but active'
          });
        }
      }
    }
    
    // Now run the actual cleanup process
    let cleanupResults = null;
    if (req.query.runCleanup === 'true') {
      console.log('Running package expiry cleanup process...');
      
      // Use the imported function
      cleanupResults = await checkAllPackagesExpiry();
      
      console.log('Package cleanup complete');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Manual package expiry check complete',
      currentTime: now.toISOString(),
      results,
      cleanupResults: cleanupResults || 'Cleanup not run'
    });
  } catch (error) {
    console.error('Error in manual package expiry check:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run manual package expiry check',
      error: error.message
    });
  }
};

// Helper function to generate frequencies based on questionnaire data
const generateFrequenciesFromQuestionnaire = async (questionnaireData) => {
  // Implementation of AI frequency generation logic
  // This is a placeholder - the actual implementation would involve more complex AI logic
  const frequencies = [];
  
  // Basic frequencies based on health concerns
  if (questionnaireData.healthConcerns && questionnaireData.healthConcerns.length > 0) {
    const concerns = questionnaireData.healthConcerns.filter(c => c.description);
    
    concerns.forEach((concern, index) => {
      // Generate a frequency based on the concern
      const baseFrequency = 396 + (index * 9);
      frequencies.push({
        name: `Healing frequency for ${concern.description}`,
        value: baseFrequency,
        duration: 3 + (concern.severity || 1),
        type: 'healing',
        priority: concern.severity || 1
      });
    });
  }
  
  // Add emotional healing frequencies
  if (questionnaireData.emotionalState) {
    frequencies.push({
      name: `Emotional balance for ${questionnaireData.emotionalState}`,
      value: 528,
      duration: 5,
      type: 'emotional',
      priority: 2
    });
  }
  
  // Add detox frequencies if toxin exposure is reported
  if (questionnaireData.toxinExposure && questionnaireData.toxinExposure.length > 0) {
    frequencies.push({
      name: 'Detoxification',
      value: 741,
      duration: 4,
      type: 'detox',
      priority: 2
    });
  }
  
  // Ensure we have at least one frequency
  if (frequencies.length === 0) {
    frequencies.push({
      name: 'General wellness',
      value: 432,
      duration: 5,
      type: 'wellness',
      priority: 1
    });
  }
  
  return frequencies;
};

// Consolidated ES module exports
export {
  getAllPackages,
  getPackageById,
  purchasePackage,
  getUserPackages,
  redeemGiftCode,
  createGiftCode,
  createPackage,
  checkPackageExpiry,
  getUserActivePackage,
  checkRenewalEligibility,
  renewPackage,
  getRenewalHistory,
  testExpiredPackages,
  forceCheckExpiredPackages,
  generateFrequenciesFromQuestionnaire
}; 