import mongoose from 'mongoose';

const audioFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    trim: true
  },
  frequencies: {
    type: [String],
    default: []
  },
  fileData: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search functionality
audioFileSchema.index({ 
  name: 'text', 
  condition: 'text',
  frequencies: 'text'
});

// Method to get file details without the large binary data
audioFileSchema.methods.getDetails = function() {
  return {
    _id: this._id,
    name: this.name,
    condition: this.condition,
    frequencies: this.frequencies,
    contentType: this.contentType,
    size: this.size,
    createdAt: this.createdAt
  };
};

const AudioFile = mongoose.model('AudioFile', audioFileSchema);

export default AudioFile; 