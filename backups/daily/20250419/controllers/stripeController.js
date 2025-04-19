import dotenv from 'dotenv';
import Stripe from 'stripe';
import User from '../models/User.js';
import Package from '../models/Package.js';
import UserPackage from '../models/UserPackage.js';
import GiftCard from '../models/GiftCard.js';
import { sendEmail } from '../utils/email.js';
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
    const { packageId, setupFutureUsage, countryCode, useExistingPaymentMethod, currency, convertedPrice } = req.body;
    
    // Validate that user exists in request object
    if (!req.user || !req.user._id) {
      console.log('Error: User not authenticated or missing user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user._id;

    console.log('Package ID:', packageId);
    console.log('User ID:', userId);
    console.log('Country Code:', countryCode);
    console.log('Using existing payment method:', useExistingPaymentMethod);
    console.log('Currency:', currency);
    console.log('Converted Price:', convertedPrice);

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
      
      // Use converted price if provided, otherwise use the package price
      if (convertedPrice !== undefined) {
        // Using the converted price from the request - ensures consistency with UI display
        amount = Math.round(convertedPrice * 100); // Convert to cents
        console.log('Using converted price:', convertedPrice);
      } else {
        // Fallback to package price (in GBP)
        amount = Math.round(package_.price * 100); // Convert to cents
        console.log('Using package base price:', package_.price);
      }
      
      metadata.packageId = packageId.toString();
      metadata.packageType = package_.type;
      metadata.packageName = package_.name;
      
      // Store pricing information in metadata
      metadata.originalPrice = package_.price;
      metadata.convertedPrice = convertedPrice || package_.price;
      metadata.currencyUsed = currency || 'GBP';
    }

    // Declare user variable at this scope level
    let user;
    
    // Find the user - validate ObjectId and add proper error handling
    try {
      // Ensure userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log('Error: Invalid user ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      
      user = await User.findById(userId);
      if (!user) {
        console.log('Error: User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log('Found user:', user.email);
      console.log('Amount (cents):', amount);

    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error finding user'
      });
    }

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
          let attempts = 0;
          const maxAttempts = 10;
          
          while (!isUnique && attempts < maxAttempts) {
            try {
              attempts++;
              code = GiftCard.generateCode();
              console.log(`Attempting to generate gift card code (attempt ${attempts}): ${code}`);
              
              // Check if code already exists
              const codeExists = await GiftCard.findOne({ code });
              if (!codeExists) {
                isUnique = true;
                console.log(`Generated unique gift card code: ${code}`);
              } else {
                console.log(`Code ${code} already exists, trying again...`);
              }
            } catch (codeErr) {
              console.error('Error generating gift card code:', codeErr);
              // Use a timestamp-based fallback code if generation fails
              code = 'GC' + Date.now().toString().slice(-6);
              isUnique = true;
              console.log(`Using fallback gift card code: ${code}`);
            }
          }
          
          // If we couldn't generate a unique code after max attempts, use a timestamp-based code
          if (!isUnique) {
            code = 'GC' + Date.now().toString().slice(-6);
            console.log(`Using timestamp-based gift card code after ${maxAttempts} attempts: ${code}`);
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
    // Accept giftCardDetails in the request body
    const { paymentIntentId, packageId, giftCardDetails } = req.body;
    const userId = req.user._id;
    
    console.log('Request body:', req.body);
    console.log('Gift card details:', giftCardDetails);
    
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
      console.log('Payment has already been processed:', existingPackage._id);
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: {
          user: await User.findById(userId).select('-password'),
          package: existingPackage
        }
      });
    }
    
    // 4. Retrieve metadata from payment intent
    const metadata = paymentIntent.metadata || {};
    console.log('Payment metadata:', metadata);
    
    // 5. Find the package and user
    const package_ = await Package.findById(packageId);
    if (!package_) {
      console.error('Package not found');
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 6. Now that payment is confirmed, apply gift card if one was used
    let giftCardApplied = null;
    if (giftCardDetails && giftCardDetails.code) {
      try {
        console.log('Applying gift card after successful payment:', giftCardDetails.code);
        const giftCard = await GiftCard.findOne({ code: giftCardDetails.code });
        
        if (giftCard) {
          // Verify gift card has enough balance
          const currentBalance = giftCard.getRemainingBalance();
          if (currentBalance >= giftCardDetails.amountToUse) {
            // Update gift card
            giftCard.amountUsed += giftCardDetails.amountToUse;
            
            // If gift card is fully exhausted, mark it as redeemed
            if (giftCard.getRemainingBalance() <= 0) {
              giftCard.isRedeemed = true;
              giftCard.redeemedAt = new Date();
              giftCard.redeemedBy = userId;
            }
            
            await giftCard.save();
            giftCardApplied = {
              code: giftCard.code,
              amountUsed: giftCardDetails.amountToUse,
              remainingBalance: giftCard.getRemainingBalance()
            };
            
            // Send email notification about gift card usage
            try {
              // Get admin emails from environment variables
              const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
              
              // Send email to recipient
              await sendEmail({
                to: user.email,
                subject: 'Gift Card Applied to Purchase',
                text: `Your gift card (${giftCard.code}) has been applied to your purchase. 
                Amount used: ${giftCardDetails.amountToUse} ${giftCard.currency}
                Remaining balance: ${giftCard.getRemainingBalance()} ${giftCard.currency}
                Thank you for your purchase!`
              });
              
              // Send email to all admins
              for (const adminEmail of adminEmails) {
                await sendEmail({
                  to: adminEmail.trim(),
                  subject: 'Gift Card Redemption Notification',
                  text: `A gift card has been applied to a purchase.
                  Gift Card: ${giftCard.code}
                  User: ${user.name} (${user.email})
                  Package: ${packageId}
                  Amount Used: ${giftCardDetails.amountToUse} ${giftCard.currency}
                  Remaining Balance: ${giftCard.getRemainingBalance()} ${giftCard.currency}`
                });
              }
            } catch (emailError) {
              console.error('Error sending gift card email notification:', emailError);
              // Don't fail the request if email sending fails
            }
          } else {
            console.error('Gift card balance insufficient at time of payment confirmation');
          }
        } else {
          console.error('Gift card not found at time of payment confirmation');
        }
      } catch (giftCardError) {
        console.error('Error applying gift card during payment confirmation:', giftCardError);
        // Continue with the purchase even if gift card application fails
      }
    }
    
    // 7. Clean up - Set previous packages to inactive
    if (user.packageType !== 'none' && user.activePackageId) {
      console.log(`User ${userId} already has an active package. Cleaning up before assigning new package.`);
      await UserPackage.updateMany(
        { user: userId, isActive: true },
        { isActive: false }
      );
    }
    
    // 8. Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + package_.durationDays);
    
    // 9. Get price and currency information from payment intent metadata
    // Use the converted price and currency if available, otherwise fallback to package price in GBP
    const packagePrice = metadata.convertedPrice ? parseFloat(metadata.convertedPrice) : package_.price;
    const currency = metadata.currencyUsed || 'GBP';
    
    console.log(`Using price ${packagePrice} ${currency} for package ${package_._id}`);
    
    // 10. Create a new user package
    const userPackage = new UserPackage({
      user: userId,
      package: packageId,
      packageType: package_.type,
      expiryDate,
      price: packagePrice,
      currency: currency, // Use the currency from the payment intent
      paymentMethod: 'credit_card',
      paymentId: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: 'completed',
      isActive: true,
      giftCardApplied: giftCardApplied ? {
        code: giftCardApplied.code,
        amountUsed: giftCardApplied.amountUsed
      } : null
    });
    
    await userPackage.save();
    console.log('User package created:', userPackage._id);
    
    // 11. Update user's package type and reference to active package
    user.packageType = package_.type;
    user.activePackageId = userPackage._id;
    
    // 12. If user has a questionnaire, update the selectedPackage info
    if (user.healthQuestionnaire) {
      user.healthQuestionnaire.selectedPackage = {
        packageId: packageId,
        packageType: package_.type
      };
    }
    
    await user.save();
    console.log('User updated with new package');
    
    // 13. Generate prescription if user has filled out a health questionnaire
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
    sendEmail({
      to: user.email,
      subject: 'Payment Confirmation',
      html: `
        <h1>Payment Confirmation</h1>
        <p>Your payment for package ${package_.name} has been confirmed.</p>
        <p>Package Type: ${package_.type}</p>
        <p>Expiry Date: ${expiryDate.toLocaleDateString()}</p>
        <p>Amount: ${packagePrice} ${currency}</p>
      `
    }).catch(err => {
      console.error('Error sending payment confirmation email:', err);
    });
    
    // Send notification to admin
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Payment Confirmation',
      html: `
        <h1>New Payment Confirmation</h1>
        <p>User ${user.name} has confirmed a payment for package ${package_.name}.</p>
        <p>Package Type: ${package_.type}</p>
        <p>Expiry Date: ${expiryDate.toLocaleDateString()}</p>
        <p>Amount: ${packagePrice} ${currency}</p>
      `
    }).catch(err => {
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
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      try {
        attempts++;
        code = GiftCard.generateCode();
        console.log(`Attempting to generate gift card code (attempt ${attempts}): ${code}`);
        
        // Check if code already exists
        const existingGiftCard = await GiftCard.findOne({ code });
        if (!existingGiftCard) {
          isUnique = true;
          console.log(`Generated unique gift card code: ${code}`);
        } else {
          console.log(`Code ${code} already exists, trying again...`);
        }
      } catch (codeErr) {
        console.error('Error generating gift card code:', codeErr);
        // Use a timestamp-based fallback code if generation fails
        code = 'GC' + Date.now().toString().slice(-6);
        isUnique = true;
        console.log(`Using fallback gift card code: ${code}`);
      }
    }
    
    // If we couldn't generate a unique code after max attempts, use a timestamp-based code
    if (!isUnique) {
      code = 'GC' + Date.now().toString().slice(-6);
      console.log(`Using timestamp-based gift card code after ${maxAttempts} attempts: ${code}`);
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

// Update an existing payment intent (e.g., when applying a gift card)
export const updatePaymentIntent = async (req, res) => {
  console.log('Updating payment intent...');
  console.log('Request body:', req.body);
  
  try {
    const { paymentIntentId, amount, currency } = req.body;
    
    // Validate that user exists in request object
    if (!req.user || !req.user._id) {
      console.log('Error: User not authenticated or missing user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user._id;

    console.log('Payment Intent ID:', paymentIntentId);
    console.log('New Amount:', amount);
    console.log('Currency:', currency);
    console.log('User ID:', userId);

    // Validate input
    if (!paymentIntentId || amount === undefined || !currency) {
      console.log('Error: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID, amount, and currency are required'
      });
    }

    // Find the user - validate ObjectId and add proper error handling
    try {
      // Ensure userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log('Error: Invalid user ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        console.log('Error: User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error finding user'
      });
    }

    // Retrieve the payment intent to verify it belongs to this user
    const existingPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify the payment intent belongs to this user
    if (existingPaymentIntent.metadata.userId !== userId.toString()) {
      console.log('Error: Payment intent does not belong to this user');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment intent'
      });
    }

    // Calculate the new amount in cents
    const amountInCents = Math.round(amount * 100);
    
    // Check if the amount is zero (fully covered by gift card)
    if (amountInCents <= 0) {
      // For a zero amount, we can't update the payment intent
      // Instead, we'll confirm it directly without capturing payment
      const confirmedIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        { payment_method: 'pm_card_visa' } // This is a test payment method that works for zero-amount confirmations
      );
      
      console.log('Zero-amount payment intent confirmed:', confirmedIntent.id);
      
      return res.status(200).json({
        success: true,
        message: 'Payment intent confirmed with zero amount',
        clientSecret: confirmedIntent.client_secret
      });
    }

    // Update the payment intent with new amount
    console.log('Updating payment intent with new amount:', amountInCents);
    const updatedPaymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        amount: amountInCents,
        currency: currency.toLowerCase()
      }
    );

    console.log('Payment intent updated:', updatedPaymentIntent.id);

    // Return the updated client secret to the frontend
    return res.status(200).json({
      success: true,
      clientSecret: updatedPaymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment intent'
    });
  }
}; 