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
    required: true
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

// Message encryption and decryption methods
const encryptMessage = (text, secretKey) => {
  // Create an initialization vector
  const iv = crypto.randomBytes(16);
  // Create cipher using AES-256-CBC with the secret key and IV
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey.substring(0, 32)), iv);
  
  // Encrypt the message
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return encrypted content and IV
  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex')
  };
};

const decryptMessage = (encryptedText, ivHex, secretKey) => {
  try {
    // Convert IV from hex to buffer
    const iv = Buffer.from(ivHex, 'hex');
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey.substring(0, 32)), iv);
    
    // Decrypt the message
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting message:', error);
    return '[Encrypted Message]'; // Fallback for failed decryption
  }
};

// Creating the models
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);

// Add encryption/decryption methods to Message model
Message.encryptMessage = encryptMessage;
Message.decryptMessage = decryptMessage;

export default Message;
export { Conversation }; 