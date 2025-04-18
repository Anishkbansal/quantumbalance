import GiftCard from '../models/GiftCard.js';
import { EXCHANGE_RATES } from '../config/constants.js';

// Minimum amount in GBP is 1
const MIN_AMOUNT_GBP = 1;

// Get minimum amounts for each currency
export const getMinAmounts = async (req, res) => {
  try {
    const minAmounts = Object.entries(EXCHANGE_RATES).reduce((acc, [currency, rate]) => {
      // Convert 1 GBP to the target currency and round up
      const minAmount = Math.ceil(MIN_AMOUNT_GBP * rate);
      acc[currency] = minAmount;
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      minAmounts
    });
  } catch (error) {
    console.error('Error getting minimum amounts:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting minimum amounts',
      error: error.message
    });
  }
};

// Create a gift card
export const createGiftCard = async (req, res) => {
  try {
    const { amount, recipientName, recipientEmail, currency, paymentIntentId, message } = req.body;
    
    // Validate input
    if (!amount || !recipientName || !recipientEmail || !currency || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check minimum amount
    const minAmount = Math.ceil(MIN_AMOUNT_GBP * EXCHANGE_RATES[currency]);
    if (amount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Gift card amount must be at least ${minAmount} ${currency}`
      });
    }
    
    // Generate a unique gift card code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = GiftCard.generateCode();
      // Check if code already exists
      const existingGiftCard = await GiftCard.findOne({ code });
      if (!existingGiftCard) {
        isUnique = true;
      }
    }
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Create and save the gift card
    const giftCard = new GiftCard({
      code,
      amount,
      currency,
      buyer: req.user._id,
      recipient: {
        name: recipientName,
        email: recipientEmail
      },
      message: message || '', // Store message if provided
      paymentIntentId,
      expiryDate
    });
    
    await giftCard.save();
    
    return res.status(201).json({
      success: true,
      message: 'Gift card created successfully',
      giftCard: {
        code: giftCard.code,
        amount: giftCard.amount,
        currency: giftCard.currency,
        recipient: giftCard.recipient,
        message: giftCard.message,
        expiryDate: giftCard.expiryDate,
        createdAt: giftCard.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating gift card:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating gift card',
      error: error.message
    });
  }
};

// Get user's purchased gift cards
export const getUserPurchases = async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email');
    
    return res.status(200).json({
      success: true,
      giftCards: giftCards.map(card => ({
        _id: card._id,
        code: card.code,
        amount: card.amount,
        currency: card.currency,
        isRedeemed: card.isRedeemed,
        recipient: card.recipient,
        expiryDate: card.expiryDate,
        status: card.getStatus(),
        remainingBalance: card.getRemainingBalance(),
        amountUsed: card.amountUsed,
        buyer: card.buyer,
        createdAt: card.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting user gift cards:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting gift cards',
      error: error.message
    });
  }
};

// Get gift cards where the user is the recipient
export const getUserReceivedGiftCards = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    
    const giftCards = await GiftCard.find({ 'recipient.email': userEmail })
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email');
    
    return res.status(200).json({
      success: true,
      giftCards: giftCards.map(card => ({
        _id: card._id,
        code: card.code,
        amount: card.amount,
        currency: card.currency,
        isRedeemed: card.isRedeemed,
        recipient: card.recipient,
        expiryDate: card.expiryDate,
        status: card.getStatus(),
        remainingBalance: card.getRemainingBalance(),
        amountUsed: card.amountUsed,
        buyer: card.buyer,
        message: card.message,
        createdAt: card.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting received gift cards:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting received gift cards',
      error: error.message
    });
  }
};

// Get gift card by code
export const getGiftCardByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift card code is required'
      });
    }
    
    const giftCard = await GiftCard.findOne({ code })
      .populate('buyer', 'name email');
    
    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: 'Gift card not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      giftCard: {
        _id: giftCard._id,
        code: giftCard.code,
        amount: giftCard.amount,
        currency: giftCard.currency,
        isRedeemed: giftCard.isRedeemed,
        recipient: giftCard.recipient,
        expiryDate: giftCard.expiryDate,
        status: giftCard.getStatus(),
        remainingBalance: giftCard.getRemainingBalance(),
        amountUsed: giftCard.amountUsed,
        buyer: giftCard.buyer,
        createdAt: giftCard.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting gift card by code:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting gift card',
      error: error.message
    });
  }
};

// Redeem a gift card (placeholder for future implementation)
export const redeemGiftCard = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift card code is required'
      });
    }
    
    const giftCard = await GiftCard.findOne({ code });
    
    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: 'Gift card not found'
      });
    }
    
    if (giftCard.isRedeemed) {
      return res.status(400).json({
        success: false,
        message: 'Gift card has already been redeemed'
      });
    }
    
    if (giftCard.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Gift card has expired'
      });
    }
    
    // This is a placeholder - actual redemption logic will be implemented later
    return res.status(200).json({
      success: true,
      message: 'Gift card found',
      giftCard: {
        amount: giftCard.amount,
        currency: giftCard.currency,
        expiryDate: giftCard.expiryDate,
        status: giftCard.getStatus()
      }
    });
  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while redeeming gift card',
      error: error.message
    });
  }
}; 