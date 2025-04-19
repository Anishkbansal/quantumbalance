import mongoose from 'mongoose';

const { Schema } = mongoose;

// Gift Card schema
const GiftCardSchema = new Schema({
  code: {
    type: String,
    required: [true, 'Gift card code is required'],
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 1
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'INR']
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    name: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [200, 'Message cannot be more than 200 characters']
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days from creation
      return date;
    }
  },
  amountUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate random alphanumeric code (6 characters)
GiftCardSchema.statics.generateCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Method to check if a gift card is expired
GiftCardSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to get the remaining balance
GiftCardSchema.methods.getRemainingBalance = function() {
  return this.amount - this.amountUsed;
};

// Method to get gift card status
GiftCardSchema.methods.getStatus = function() {
  if (this.isExpired()) {
    return 'expired';
  } else if (this.amountUsed >= this.amount) {
    return 'exhausted';
  } else {
    return 'active';
  }
};

// Create indexes for faster queries
GiftCardSchema.index({ code: 1 });
GiftCardSchema.index({ buyer: 1 });
GiftCardSchema.index({ 'recipient.email': 1 });
GiftCardSchema.index({ isRedeemed: 1 });
GiftCardSchema.index({ expiryDate: 1 });

const GiftCard = mongoose.model('GiftCard', GiftCardSchema);

export default GiftCard; 