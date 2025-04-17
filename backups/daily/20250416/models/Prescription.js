import mongoose from 'mongoose';

const frequencySchema = new mongoose.Schema({
  value: {
    type: [String],
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile',
    default: null
  }
});

const prescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  frequencies: {
    type: [frequencySchema],
    default: []
  },
  timing: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'pending'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will handle createdAt and updatedAt automatically
});

// Create indexes for faster queries
prescriptionSchema.index({ userId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ packageId: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription; 