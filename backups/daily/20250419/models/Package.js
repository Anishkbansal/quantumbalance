import mongoose from 'mongoose';

const { Schema } = mongoose;

// Package schema - represents a package type available in the system
const PackageSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Package type is required'],
    enum: ['single', 'basic', 'enhanced', 'premium'],
    default: 'basic'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  durationDays: {
    type: Number,
    required: [true, 'Duration in days is required'],
    min: 1
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  features: {
    type: [String],
    default: []
  },
  maxPrescriptions: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
PackageSchema.index({ type: 1 });
PackageSchema.index({ isActive: 1 });

// Create the Package model
const Package = mongoose.model('Package', PackageSchema);

export default Package; 