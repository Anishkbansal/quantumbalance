import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Model - JavaScript implementation
 * 
 * Note: This is the JavaScript implementation that is currently in use.
 * There is also a TypeScript version (User.ts) that should be maintained in parallel
 * until the codebase is fully migrated to TypeScript.
 */

const { Schema } = mongoose;

// User schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
  },
  phone: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  profilePicture: {
    type: String,
    default: '',
  },
  profile: {
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
  },
  packageType: {
    type: String,
    enum: ['none', 'single', 'basic', 'enhanced', 'premium'],
    default: 'none',
  },
  activePackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPackage',
    default: null
  },
  activePrescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  premiumAudios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile'
  }],
  wellnessEntries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellnessEntry'
  }],
  healthQuestionnaire: {
    isPregnant: {
      type: Boolean,
      default: false,
    },
    healthConcerns: [
      {
        description: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['acute', 'chronic'],
          required: true,
        },
        severity: {
          type: Number,
          enum: [1, 2, 3, 4],
          required: true,
        },
      },
    ],
    painLocations: {
      type: [String],
      default: [],
    },
    otherPainLocation: {
      type: String,
      default: '',
    },
    emotionalState: {
      type: String,
      default: '',
    },
    toxinExposure: {
      type: [String],
      default: [],
    },
    lifestyleFactors: {
      type: [String],
      default: [],
    },
    healingGoals: {
      type: [String],
      default: [],
    },
    otherHealingGoals: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    }
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adminCode: {
    type: String,
    select: false, // Hide this field by default in query results
  },
  // Stripe customer ID for payment processing
  stripeCustomerId: {
    type: String,
    default: null
  },
  // Default payment method ID
  defaultPaymentMethodId: {
    type: String,
    default: null
  },
  // Payment method fields
  billing: {
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      line1: {
        type: String,
        default: ''
      },
      line2: {
        type: String, 
        default: ''
      },
      city: {
        type: String,
        default: ''
      },
      state: {
        type: String,
        default: ''
      },
      postal_code: {
        type: String,
        default: ''
      },
      country: {
        type: String,
        default: 'US'
      }
    }
  },
  paymentMethods: {
    stripe: {
      paymentMethodId: {
        type: String,
        default: null
      },
      last4: {
        type: String,
        default: null
      },
      brand: {
        type: String,
        default: null
      },
      expiryMonth: {
        type: Number,
        default: null
      },
      expiryYear: {
        type: Number,
        default: null
      },
      updatedAt: {
        type: Date,
        default: null
      }
    }
  },
}, {
  timestamps: true,
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with proper type casting
    this.password = await bcrypt.hash(this.password, salt);
    // Hash admin code if present
    if (this.adminCode) {
      this.adminCode = await bcrypt.hash(this.adminCode, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if the user's package is expired
UserSchema.methods.isPackageExpired = async function() {
  if (!this.activePackageId) {
    return true;
  }
  
  try {
    // Import UserPackage model
    const UserPackage = mongoose.model('UserPackage');
    
    // Find the active user package
    const userPackage = await UserPackage.findOne({ 
      _id: this.activePackageId,
      isActive: true 
    });
    
    if (!userPackage || !userPackage.expiryDate) {
      return true;
    }
    
    // Check for renewal eligibility while we're here
    await userPackage.updateRenewalEligibility();
    
    const now = new Date();
    return now > new Date(userPackage.expiryDate);
  } catch (error) {
    console.error('Error checking package expiry:', error);
    return true; // Assume expired on error
  }
};

// Method to check active package and reset if expired
UserSchema.methods.checkAndUpdatePackageStatus = async function() {
  if (this.packageType === 'none' || !this.activePackageId) {
    return false;
  }
  
  try {
    const isExpired = await this.isPackageExpired();
    
    if (isExpired) {
      // Update user's package status
      this.packageType = 'none';
      
      // Import UserPackage model
      const UserPackage = mongoose.model('UserPackage');
      
      // Set package to inactive
      await UserPackage.findByIdAndUpdate(
        this.activePackageId,
        { isActive: false }
      );
      
      // Clear active package reference
      this.activePackageId = null;
      
      await this.save();
      return true; // Package was expired and updated
    }
    
    return false; // No change needed
  } catch (error) {
    console.error('Error updating package status:', error);
    return false;
  }
};

// Method to check if package is eligible for renewal
UserSchema.methods.checkRenewalEligibility = async function() {
  if (this.packageType === 'none' || !this.activePackageId) {
    return {
      isEligible: false,
      message: 'No active package'
    };
  }
  
  try {
    const UserPackage = mongoose.model('UserPackage');
    
    const userPackage = await UserPackage.findById(this.activePackageId);
    if (!userPackage) {
      return {
        isEligible: false,
        message: 'Package not found'
      };
    }
    
    // Update and get renewal eligibility
    const isEligible = await userPackage.updateRenewalEligibility();
    
    return {
      isEligible,
      package: userPackage,
      renewalEligibleDate: userPackage.renewalEligibleDate,
      message: isEligible ? 'Eligible for renewal' : 'Not yet eligible for renewal'
    };
  } catch (error) {
    console.error('Error checking renewal eligibility:', error);
    return {
      isEligible: false,
      message: 'Error checking eligibility'
    };
  }
};

// Create and export the User model
const User = mongoose.model('User', UserSchema);

export default User; 