import mongoose from 'mongoose';
import crypto from 'crypto';

const { Schema } = mongoose;

// Message schema (embedded in Conversation)
const MessageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: false // Make IV optional since we're removing encryption
  },
  readBySender: {
    type: Boolean,
    default: true
  },
  readByRecipient: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Conversation schema
const ConversationSchema = new Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [MessageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp when messages are added
ConversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastUpdated = new Date();
  }
  next();
});

// Static method to find or create a conversation between two users
ConversationSchema.statics.findOrCreateConversation = async function(userId1, userId2) {
  // Sort user IDs to ensure consistent lookup regardless of order
  const participants = [userId1, userId2].sort();
  
  // Find existing conversation
  let conversation = await this.findOne({
    participants: { $all: participants }
  });
  
  // Create a new conversation if none exists
  if (!conversation) {
    conversation = new this({
      participants,
      messages: []
    });
  }
  
  return conversation;
};

// Plain text message methods (no encryption)
const encryptMessage = (text) => {
  // Return plain text with dummy IV (for backwards compatibility)
  return {
    encryptedContent: text,
    iv: "no_encryption_used"
  };
};

const decryptMessage = (text) => {
  // Simply return the text as is
  return text;
};

// Creating the models
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);

// Add encryption/decryption methods to Message model
Message.encryptMessage = encryptMessage;
Message.decryptMessage = decryptMessage;

export default Message;
export { Conversation }; 