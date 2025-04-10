import mongoose from 'mongoose';

const healthQuestionnaireSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPregnant: {
    type: Boolean,
    default: false
  },
  age: {
    type: String
  },
  gender: {
    type: String
  },
  height: {
    type: String
  },
  weight: {
    type: String
  },
  healthConcerns: {
    type: [{
      description: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['acute', 'chronic'],
        required: true
      },
      severity: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: true
      }
    }],
    default: []
  },
  painLocations: {
    type: [String],
    default: []
  },
  otherPainLocation: {
    type: String,
    default: ''
  },
  emotionalState: {
    type: String,
    default: ''
  },
  toxinExposure: {
    type: [String],
    default: []
  },
  lifestyleFactors: {
    type: [String],
    default: []
  },
  healingGoals: {
    type: [String],
    default: []
  },
  otherHealingGoals: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
healthQuestionnaireSchema.index({ userId: 1 });

const HealthQuestionnaire = mongoose.model('HealthQuestionnaire', healthQuestionnaireSchema);

export default HealthQuestionnaire; 