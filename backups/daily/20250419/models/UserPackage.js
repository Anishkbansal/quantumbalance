import mongoose from 'mongoose';

const { Schema } = mongoose;

// UserPackage schema - represents a package purchased by a user
const UserPackageSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  packageType: {
    type: String,
    required: [true, 'Package type is required'],
    enum: ['single', 'basic', 'enhanced', 'premium'],
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prescriptionsUsed: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'INR'],
    default: 'GBP'
  },
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'gift_code', 'other'],
    default: 'credit_card'
  },
  paymentId: {
    type: String,
    default: null
  },
  // For backward compatibility with existing records
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  // Only track payment status, not method details
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftCode: {
    type: String,
    default: null
  },
  // Renewal fields
  renewalEligibleDate: {
    type: Date,
    default: null
  },
  isRenewalEligible: {
    type: Boolean,
    default: false
  },
  renewedFromPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPackage',
    default: null
  },
  renewedToPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPackage',
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
UserPackageSchema.index({ user: 1, isActive: 1 });
UserPackageSchema.index({ expiryDate: 1 });
UserPackageSchema.index({ giftCode: 1 }, { sparse: true });
UserPackageSchema.index({ isRenewalEligible: 1 });

// Method to check if package is eligible for renewal (1.5 days before expiry)
UserPackageSchema.methods.checkRenewalEligibility = function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  const expiryDate = new Date(this.expiryDate);
  
  // Calculate the date exactly 1.5 days (36 hours) before expiry
  const renewalEligibleDate = new Date(expiryDate);
  renewalEligibleDate.setHours(renewalEligibleDate.getHours() - 36); // Exactly 1.5 days (36 hours)
  
  // Save the renewal eligible date for reference
  this.renewalEligibleDate = renewalEligibleDate;
  
  // Check if current date is past the renewal eligible date
  const isEligible = now >= renewalEligibleDate;
  
  // Detailed logging to help debug renewal eligibility
  console.log(`Package ${this._id}:`);
  console.log(`- Package type: ${this.packageType}`);
  console.log(`- Expires: ${expiryDate.toISOString()}`);
  console.log(`- Renewal eligible from: ${renewalEligibleDate.toISOString()}`);
  console.log(`- Current time: ${now.toISOString()}`);
  console.log(`- Is eligible for renewal: ${isEligible}`);
  console.log(`- Time until expiry (hours): ${Math.round((expiryDate - now) / (1000 * 60 * 60))}`);
  
  return isEligible;
};

// Method to update renewal eligibility status
UserPackageSchema.methods.updateRenewalEligibility = async function() {
  const isEligible = this.checkRenewalEligibility();
  
  if (isEligible !== this.isRenewalEligible) {
    this.isRenewalEligible = isEligible;
    await this.save();
  }
  
  return isEligible;
};

// Add a method to test expiry check with a mock date
UserPackageSchema.methods.isExpiredWithMockDate = function(mockDate) {
  if (!this.expiryDate) return true;
  
  // Use provided mock date or current date
  const testDate = mockDate || new Date();
  const expiryDate = new Date(this.expiryDate);
  
  const isExpired = testDate > expiryDate;
  console.log(`TEST EXPIRY - Package ${this._id}:`);
  console.log(`- Expiry date: ${expiryDate.toISOString()}`);
  console.log(`- Test date: ${testDate.toISOString()}`);
  console.log(`- Is expired: ${isExpired}`);
  
  return isExpired;
};

// Add a method to check if package is expired
UserPackageSchema.methods.isExpired = function() {
  if (!this.expiryDate) {
    console.log(`Package ${this._id} has no expiry date, considering as expired`);
    return true;
  }
  
  const now = new Date();
  const expiryDate = new Date(this.expiryDate);
  const isExpired = now > expiryDate;
  
  const diffHours = Math.round((expiryDate - now) / (1000 * 60 * 60));
  if (isExpired || Math.abs(diffHours) < 48) {
    console.log(`Package ${this._id} (${this.packageType}) - Expiry: ${expiryDate.toISOString()}, Status: ${this.isActive ? 'ACTIVE' : 'inactive'}, Expired: ${isExpired ? `YES (${-diffHours} hours ago)` : `no (${diffHours} hours remaining)`}`);
  }
  
  return isExpired;
};

// Create and export the UserPackage model
const UserPackage = mongoose.model('UserPackage', UserPackageSchema);

export default UserPackage; 