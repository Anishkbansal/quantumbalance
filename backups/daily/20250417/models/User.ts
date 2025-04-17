import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Health concern type for questionnaire
export interface HealthConcern {
  description: string;
  type: 'acute' | 'chronic';
  severity: 1 | 2 | 3 | 4;
}

// Health questionnaire data
export interface HealthQuestionnaireData {
  isPregnant: boolean;
  healthConcerns: HealthConcern[];
  painLocations: string[];
  otherPainLocation?: string;
  emotionalState: string;
  toxinExposure: string[];
  lifestyleFactors: string[];
  healingGoals: string[];
  createdAt: Date;
  updatedAt?: Date;
  selectedPackage?: {
    packageId: string | null;
    packageType: string;
  };
}

// Package type
export type PackageType = 'none' | 'single' | 'basic' | 'enhanced' | 'premium';

// User interface extending Document
interface IUser extends mongoose.Document { 
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  username: string;
  password: string;
  profile: {
    avatar?: string;
    bio?: string;
    phone?: string;
  };
  packageType: PackageType;
  healthQuestionnaire: HealthQuestionnaireData | null;
  joiningDate: Date;
  isVerified: boolean;
  isAdmin: boolean;
  adminCode?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const UserSchema: Schema = new Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
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
    phone: {
      type: String,
      default: '',
    },
  },
  packageType: {
    type: String,
    enum: ['none', 'single', 'basic', 'enhanced', 'premium'],
    default: 'none',
  },
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
      required: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    selectedPackage: {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
        default: null,
      },
      packageType: {
        type: String,
        enum: ['none', 'single', 'basic', 'enhanced', 'premium'],
        default: 'none',
      },
    },
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
    this.password = await bcrypt.hash(this.password as string, salt);
    // Hash admin code if present
    if (this.adminCode) {
      this.adminCode = await bcrypt.hash(this.adminCode as string, salt);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User; 