import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as giftCardController from '../controllers/giftCardController.js';

const router = express.Router();

// Create a gift card (purchase)
router.post('/create', protect, giftCardController.createGiftCard);

// Get user's purchased gift cards
router.get('/my-purchases', protect, giftCardController.getUserPurchases);

// Get gift cards where the user is the recipient
router.get('/my-received', protect, giftCardController.getUserReceivedGiftCards);

// Get gift card by code
router.get('/by-code/:code', protect, giftCardController.getGiftCardByCode);

// Future endpoint for redeeming gift cards
router.post('/redeem', protect, giftCardController.redeemGiftCard);

// Apply gift card to package purchase
router.post('/apply-to-package', protect, giftCardController.applyGiftCardToPackage);

// Get minimum amounts for each currency
router.get('/min-amounts', giftCardController.getMinAmounts);

// Admin routes
router.get('/admin', protect, giftCardController.getAllGiftCards);
router.post('/admin/create', protect, giftCardController.adminCreateGiftCard);

export default router; 