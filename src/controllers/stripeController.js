import dotenv from 'dotenv';
import Stripe from 'stripe';
import User from '../models/User.js';
import Package from '../models/Package.js';
import UserPackage from '../models/UserPackage.js';
import GiftCard from '../models/GiftCard.js';
import { createCustomEmailTemplate, sendEmail, sendPaymentConfirmation, sendPaymentNotificationToAdmin } from '../utils/emailService.js';
import mongoose from 'mongoose';
import { generateAIPrescription } from '../utils/prescriptionService.js';
import * as giftCardController from '../controllers/giftCardController.js';

dotenv.config();

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Add debug logging for Stripe-related operations
console.log('Stripe controller initialized');
console.log('Environment:', process.env.NODE_ENV);
console.log('Stripe API version:', stripe.getApiField('version'));

// Create a payment intent for purchasing a package or gift card
export const createPaymentIntent = async (req, res) => {
  console.log('Creating payment intent...');
  console.log('Request body:', req.body);
  
  try {
    const { packageId, setupFutureUsage, countryCode, useExistingPaymentMethod, currency } = req.body;
    const userId = req.user._id;

    console.log('Package ID:', packageId);
    console.log('User ID:', userId);
    console.log('Country Code:', countryCode);
    console.log('Using existing payment method:', useExistingPaymentMethod);
    console.log('Currency:', currency);

    // Validate input
    if (!packageId) {
      console.log('Error: Package ID is required');
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }

    // Special handling for gift card purchases
    let amount;
    let metadata = {
      userId: userId.toString(),
      countryCode: countryCode || 'US'
    };

    if (packageId === 'gift-card') {
      // For gift cards, amount should be provided in request body
      if (!req.body.amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required for gift card purchases'
        });
      }
      
      amount = Math.round(parseFloat(req.body.amount) * 100); // Convert to cents
      metadata.isGiftCard = 'true';
      metadata.recipientName = req.body.recipientName || '';
      metadata.recipientEmail = req.body.recipientEmail || '';
      metadata.giftCardCurrency = currency || 'GBP';
    } else {
      // Find the package for regular package purchases
    const package_ = await Package.findById(packageId);
    if (!package_) {
      console.log('Error: Package not found');
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    console.log('Found package:', package_.name);
      amount = Math.round(package_.price * 100); // Convert to cents
      metadata.packageId = packageId.toString();
      metadata.packageType = package_.type;
      metadata.packageName = package_.name;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('Error: User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', user.email);
    console.log('Amount (cents):', amount);

    // Create payment intent options
    const paymentIntentOptions = {
      amount,
      currency: currency ? currency.toLowerCase() : (countryCode === 'US' ? 'usd' : 'gbp'),
      metadata
    };

    // If using existing payment method, include the customer ID
    if (useExistingPaymentMethod && user.stripeCustomerId) {
      console.log('Adding customer ID to payment intent:', user.stripeCustomerId);
      paymentIntentOptions.customer = user.stripeCustomerId;
    }

    // Add setup_future_usage if needed
    if (setupFutureUsage) {
      paymentIntentOptions.setup_future_usage = setupFutureUsage;
    }

    // Create a payment intent
    console.log('Creating Stripe payment intent with options:', paymentIntentOptions);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    console.log('Payment intent created:', paymentIntent.id);

    // Return the client secret to the frontend
    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating payment intent'
    });
  }
};

// Webhook handler for Stripe events
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment intent succeeded:', paymentIntent.id);
      
      try {
        // Check if this is a gift card purchase
        if (paymentIntent.metadata?.isGiftCard === 'true') {
          console.log('Processing gift card purchase');
          
          // Find the user
          const user = await User.findById(paymentIntent.metadata.userId);
          if (!user) {
            console.error('User not found for gift card purchase:', paymentIntent.metadata.userId);
            break;
          }
          
          // Check if a gift card already exists for this payment
          const existingGiftCard = await GiftCard.findOne({ paymentIntentId: paymentIntent.id });
          if (existingGiftCard) {
            console.log('Gift card already created for this payment:', existingGiftCard.code);
            break;
          }
          
          // Generate a unique gift card code
          let code;
          let isUnique = false;
          while (!isUnique) {
            code = GiftCard.generateCode();
            // Check if code already exists
            const codeExists = await GiftCard.findOne({ code });
            if (!codeExists) {
              isUnique = true;
            }
          }
          
          // Create the gift card
          const giftCard = new GiftCard({
            code,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.metadata.giftCardCurrency || 'GBP',
            buyer: paymentIntent.metadata.userId,
            recipient: {
              name: paymentIntent.metadata.recipientName || 'Gift Recipient',
              email: paymentIntent.metadata.recipientEmail || user.email
            },
            paymentIntentId: paymentIntent.id
          });
          
          await giftCard.save();
          console.log('Gift card created via webhook:', giftCard.code);
          
          // Send emails if recipient info is available
          if (paymentIntent.metadata.recipientEmail) {
            try {
              const emailContent = `
                <h1>You've Received a Gift Card!</h1>
                <p>${user.name} has sent you a gift card for ${giftCard.amount} ${giftCard.currency}.</p>
                <p>Gift Card Code: <strong>${code}</strong></p>
                <p>You can redeem this code at our website to apply the balance to your account.</p>
              `;
              
              await sendEmail({
                to: paymentIntent.metadata.recipientEmail,
                subject: 'You\'ve Received a Quantum Balance Gift Card!',
                html: emailContent
              });
              
              // Also send a confirmation to the buyer
              const buyerEmailContent = `
                <h1>Gift Card Purchase Confirmation</h1>
                <p>You have successfully purchased a gift card for ${paymentIntent.metadata.recipientName}.</p>
                <p>Amount: ${giftCard.amount} ${giftCard.currency}</p>
                <p>Gift Card Code: <strong>${code}</strong></p>
                <p>The recipient will receive an email with the gift card details.</p>
              `;
              
              await sendEmail({
                to: user.email,
                subject: 'Gift Card Purchase Confirmation',
                html: buyerEmailContent
              });
            } catch (emailError) {
              console.error('Error sending gift card emails via webhook:', emailError);
            }
          }
        } else {
          // Handle regular package purchases
          // Existing package processing code here...
        }
      } catch (err) {
        console.error('Error processing payment success webhook:', err);
      }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};

// Get user's saved payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create a Stripe customer if not exists
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString()
        }
      });
      
      customerId = customer.id;
      
      // Save Stripe customer ID to user
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    
    // Format payment methods with default flag
    const formattedPaymentMethods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expMonth: method.card.exp_month,
      expYear: method.card.exp_year,
      isDefault: user.defaultPaymentMethodId === method.id
    }));
    
    return res.status(200).json({
      success: true,
      paymentMethods: formattedPaymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payment methods'
    });
  }
};

// Add a new payment method
export const addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user._id;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString()
        }
      });
      
      customerId = customer.id;
      user.stripeCustomerId = customerId;
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    
    // If this is the first payment method, set it as default
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    
    if (paymentMethods.data.length === 1) {
      user.defaultPaymentMethodId = paymentMethodId;
      
      // Also update the Stripe customer's default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding payment method'
    });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user._id;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'No payment methods found'
      });
    }
    
    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);
    
    // If this was the default payment method, update user
    if (user.defaultPaymentMethodId === paymentMethodId) {
      // Get remaining payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      });
      
      // If there are other payment methods, set the first one as default
      if (paymentMethods.data.length > 0) {
        user.defaultPaymentMethodId = paymentMethods.data[0].id;
        
        // Update Stripe customer's default payment method
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethods.data[0].id
          }
        });
      } else {
        user.defaultPaymentMethodId = null;
      }
      
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting payment method'
    });
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user._id;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'No payment methods found'
      });
    }
    
    // Set as default in user record
    user.defaultPaymentMethodId = paymentMethodId;
    await user.save();
    
    // Update Stripe customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Default payment method updated successfully'
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error setting default payment method'
    });
  }
};

// Save/update user billing details
export const updateBillingDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, address, phone } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update billing info
    user.billing = {
      name: name || user.billing?.name || user.name,
      email: email || user.billing?.email || user.email,
      phone: phone || user.billing?.phone || user.phone,
      address: {
        line1: address?.line1 || user.billing?.address?.line1 || '',
        line2: address?.line2 || user.billing?.address?.line2 || '',
        city: address?.city || user.billing?.address?.city || '',
        state: address?.state || user.billing?.address?.state || '',
        postal_code: address?.postal_code || user.billing?.address?.postal_code || '',
        country: address?.country || user.billing?.address?.country || 'US'
      }
    };
    
    await user.save();
    
    // If user has a Stripe customer, update their details there too
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        name: user.billing.name,
        email: user.billing.email,
        phone: user.billing.phone,
        address: {
          line1: user.billing.address.line1,
          line2: user.billing.address.line2 || undefined,
          city: user.billing.address.city,
          state: user.billing.address.state,
          postal_code: user.billing.address.postal_code,
          country: user.billing.address.country
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Billing details updated successfully',
      billing: user.billing
    });
  } catch (error) {
    console.error('Error updating billing details:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating billing details'
    });
  }
};

// Get user billing details
export const getBillingDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      billing: user.billing || {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing details:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching billing details'
    });
  }
};

// Confirm payment and provision package
export const confirmPaymentAndProvisionPackage = async (req, res) => {
  console.log('Confirming payment and provisioning package...');
  
  try {
    const { paymentIntentId, packageId } = req.body;
    const userId = req.user._id;
    
    if (!paymentIntentId || !packageId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and package ID are required'
      });
    }
    
    console.log(`Confirming payment intent ${paymentIntentId} for package ${packageId}`);
    
    // 1. Verify the payment intent with Stripe first
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      console.error('Payment intent not found');
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }
    
    // 2. Validate the payment status
    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment not succeeded. Current status: ${paymentIntent.status}`);
      return res.status(400).json({
        success: false,
        message: `Payment has not been confirmed. Status: ${paymentIntent.status}`
      });
    }
    
    // 3. Check if payment has already been processed (idempotency)
    const existingPackage = await UserPackage.findOne({ 
      paymentId: paymentIntentId,
      user: userId 
    });
    
    if (existingPackage) {
      console.log('Payment already processed. Returning existing package.');
      // Payment has already been processed, return success with existing data
      const user = await User.findById(userId);
      
      return res.status(200).json({
        success: true,
        message: 'Package already provisioned for this payment',
        data: {
          userPackage: existingPackage,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            packageType: user.packageType,
            activePackageId: user.activePackageId
          }
        }
      });
    }
    
    // 4. Find the package
    const package_ = await Package.findById(packageId);
    if (!package_) {
      console.error('Package not found');
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    // 5. Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // 6. Clean up - Set previous packages to inactive
    if (user.packageType !== 'none' && user.activePackageId) {
      console.log(`User ${userId} already has an active package. Cleaning up before assigning new package.`);
      await UserPackage.updateMany(
        { user: userId, isActive: true },
        { isActive: false }
      );
    }
    
    // 7. Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + package_.durationDays);
    
    // 8. Create a new user package
    const userPackage = new UserPackage({
      user: userId,
      package: packageId,
      packageType: package_.type,
      expiryDate,
      price: package_.price,
      paymentMethod: 'credit_card',
      paymentId: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: 'completed',
      isActive: true
    });
    
    await userPackage.save();
    console.log('User package created:', userPackage._id);
    
    // 9. Update user's package type and reference to active package
    user.packageType = package_.type;
    user.activePackageId = userPackage._id;
    
    // 10. If user has a questionnaire, update the selectedPackage info
    if (user.healthQuestionnaire) {
      user.healthQuestionnaire.selectedPackage = {
        packageId: packageId,
        packageType: package_.type
      };
    }
    
    await user.save();
    console.log('User updated with new package');
    
    // 11. Generate prescription if user has filled out a health questionnaire
    let prescriptionResult = null;
    if (user.healthQuestionnaire) {
      try {
        console.log(`Generating AI prescription for user ${userId} after package purchase...`);
        
        prescriptionResult = await generateAIPrescription(userId);
        
        if (prescriptionResult.success) {
          console.log(`AI PRESCRIPTION GENERATED AFTER PACKAGE PURCHASE`);
          console.log(`Generated prescription ID: ${prescriptionResult.prescription._id}`);
        } else {
          console.error(`Failed to generate AI prescription for user ${userId}:`, prescriptionResult.message);
        }
      } catch (prescriptionError) {
        console.error(`Error generating AI prescription for user ${userId}:`, prescriptionError);
      }
    } else {
      console.log(`User ${userId} has no health questionnaire. No AI prescription generated.`);
    }
    
    console.log('User package created. Sending confirmation emails...');
    
    // Send payment confirmation email to user
    sendPaymentConfirmation(user, package_, { id: paymentIntentId }).catch(err => {
      console.error('Error sending payment confirmation email:', err);
    });
    
    // Send notification to admin
    sendPaymentNotificationToAdmin(user, package_, { id: paymentIntentId }).catch(err => {
      console.error('Error sending payment notification to admin:', err);
    });
    
    return res.status(201).json({
      success: true,
      message: 'Payment confirmed and package provisioned successfully',
      data: {
        package: package_,
        userPackage: userPackage,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          packageType: user.packageType,
          activePackageId: user.activePackageId
        },
        prescription: prescriptionResult?.success ? {
          generated: true,
          id: prescriptionResult.prescription._id
        } : {
          generated: false
        }
      }
    });
  } catch (error) {
    console.error('Error confirming payment and provisioning package:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing payment confirmation',
      error: error.toString()
    });
  }
};

// Confirm payment and create gift card
export const confirmPaymentAndCreateGiftCard = async (req, res) => {
  try {
    const { paymentIntentId, recipientName, recipientEmail, amount, currency } = req.body;
    const userId = req.user._id;
    
    if (!paymentIntentId || !recipientName || !recipientEmail || !amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Retrieve payment intent to verify it's succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed'
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
    
    // Create the gift card
    const giftCard = new GiftCard({
      code,
      amount,
      currency,
      buyer: userId,
      recipient: {
        name: recipientName,
        email: recipientEmail
      },
      paymentIntentId
    });
    
    await giftCard.save();
    
    // Send email to recipient with gift card details
    try {
      const user = await User.findById(userId);
      const emailContent = `
        <h1>You've Received a Gift Card!</h1>
        <p>${user.name} has sent you a gift card for ${amount} ${currency}.</p>
        <p>Gift Card Code: <strong>${code}</strong></p>
        <p>You can redeem this code at our website to apply the balance to your account.</p>
      `;
      
      await sendEmail({
        to: recipientEmail,
        subject: 'You\'ve Received a Quantum Balance Gift Card!',
        html: emailContent
      });
      
      // Also send a confirmation to the buyer
      const buyerEmailContent = `
        <h1>Gift Card Purchase Confirmation</h1>
        <p>You have successfully purchased a gift card for ${recipientName}.</p>
        <p>Amount: ${amount} ${currency}</p>
        <p>Gift Card Code: <strong>${code}</strong></p>
        <p>The recipient will receive an email with the gift card details.</p>
      `;
      
      await sendEmail({
        to: user.email,
        subject: 'Gift Card Purchase Confirmation',
        html: buyerEmailContent
      });
    } catch (emailError) {
      console.error('Error sending gift card emails:', emailError);
      // Don't fail the request if email sending fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'Gift card created successfully',
      giftCard: {
        code: giftCard.code,
        amount: giftCard.amount,
        currency: giftCard.currency,
        recipient: giftCard.recipient
      }
    });
  } catch (error) {
    console.error('Error creating gift card:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating gift card'
    });
  }
};

export const confirmGiftCard = async (req, res) => {
  try {
    const { paymentIntentId, amount, currency, recipientName, recipientEmail, message } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Verify payment intent succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not succeeded'
      });
    }
    
    // Create a gift card using the gift card controller
    const giftCardResponse = await giftCardController.createGiftCard({
      body: {
        amount,
        currency,
        recipientName,
        recipientEmail,
        paymentIntentId,
        message
      },
      user: req.user
    }, { json: () => {} });
    
    // Send email to buyer
    // Implementation depends on your email service
    
    // Send email to recipient
    // Implementation depends on your email service
    
    return res.status(200).json({
      success: true,
      message: 'Gift card created successfully',
      giftCard: giftCardResponse.giftCard
    });
  } catch (error) {
    console.error('Error confirming gift card payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while confirming gift card payment',
      error: error.message
    });
  }
}; 