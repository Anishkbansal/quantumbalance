import express from 'express';
import { 
  createPaymentIntent, 
  handleWebhook, 
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updateBillingDetails,
  getBillingDetails,
  confirmPaymentAndProvisionPackage,
  confirmPaymentAndCreateGiftCard
} from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a payment intent for purchasing a package
router.post('/create-payment-intent', protect, createPaymentIntent);

// Confirm payment and provision package
router.post('/confirm-payment', protect, confirmPaymentAndProvisionPackage);

// Confirm payment and create gift card
router.post('/confirm-gift-card', protect, confirmPaymentAndCreateGiftCard);

// Stripe webhook endpoint (no auth required - called by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Payment method management routes (auth required)
router.get('/payment-methods', protect, getPaymentMethods);
router.post('/payment-methods', protect, addPaymentMethod);
router.delete('/payment-methods/:paymentMethodId', protect, deletePaymentMethod);
router.post('/default-payment-method', protect, setDefaultPaymentMethod);

// Billing details routes
router.get('/billing-details', protect, getBillingDetails);
router.post('/billing-details', protect, updateBillingDetails);

export default router; 