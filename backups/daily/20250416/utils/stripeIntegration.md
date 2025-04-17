# Stripe Integration Guide

This document outlines the recommended approach for integrating Stripe payments into the Quantum Balance application, following security best practices.

## Architecture Overview

1. **Client-side (React)**
   - Collect payment information using Stripe Elements
   - Never handle raw card data in our application code
   - Submit payment intent confirmation to Stripe directly

2. **Server-side (Node.js)**
   - Create payment intents
   - Verify payment statuses
   - Update user accounts after confirmed payments
   - Store only reference IDs, not sensitive payment data

## Implementation Steps

### 1. Setup & Configuration

1. Install Stripe libraries:
   ```
   npm install @stripe/stripe-js @stripe/react-stripe-js stripe
   ```

2. Initialize Stripe in your React app:
   ```jsx
   import { loadStripe } from '@stripe/stripe-js';
   const stripePromise = loadStripe('your_publishable_key');
   ```

3. Set up server-side Stripe instance:
   ```js
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   ```

### 2. Payment Flow

1. **Create Payment Intent (Server)**
   ```js
   // Server endpoint
   app.post('/create-payment-intent', async (req, res) => {
     try {
       const { packageId } = req.body;
       const package = await Package.findById(packageId);
       
       if (!package) {
         return res.status(404).json({ error: 'Package not found' });
       }
       
       // Create a PaymentIntent with the order amount and currency
       const paymentIntent = await stripe.paymentIntents.create({
         amount: package.price * 100, // Stripe uses cents
         currency: 'usd',
         metadata: {
           packageId: packageId,
           userId: req.user._id.toString()
         }
       });
       
       res.json({
         clientSecret: paymentIntent.client_secret
       });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Collect Payment Details (Client)**
   ```jsx
   import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

   function CheckoutForm({ packageId }) {
     const stripe = useStripe();
     const elements = useElements();
     
     const handleSubmit = async (event) => {
       event.preventDefault();
       
       if (!stripe || !elements) {
         return;
       }
       
       // Get client secret from server
       const response = await fetch('/create-payment-intent', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ packageId }),
       });
       
       const { clientSecret } = await response.json();
       
       // Confirm payment
       const result = await stripe.confirmCardPayment(clientSecret, {
         payment_method: {
           card: elements.getElement(CardElement),
         }
       });
       
       if (result.error) {
         console.error(result.error.message);
       } else if (result.paymentIntent.status === 'succeeded') {
         // Payment succeeded - call our server to update the user's account
         await fetch('/complete-purchase', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ 
             packageId,
             stripePaymentIntentId: result.paymentIntent.id
           }),
         });
       }
     };
     
     return (
       <form onSubmit={handleSubmit}>
         <CardElement />
         <button type="submit" disabled={!stripe}>Pay</button>
       </form>
     );
   }
   ```

3. **Complete Purchase (Server)**
   ```js
   app.post('/complete-purchase', async (req, res) => {
     try {
       const { packageId, stripePaymentIntentId } = req.body;
       
       // Verify payment with Stripe
       const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
       
       // Only proceed if payment was successful
       if (paymentIntent.status !== 'succeeded') {
         return res.status(400).json({ error: 'Payment was not successful' });
       }
       
       // Verify that this payment was for the correct package and user
       if (paymentIntent.metadata.packageId !== packageId ||
           paymentIntent.metadata.userId !== req.user._id.toString()) {
         return res.status(400).json({ error: 'Payment verification failed' });
       }
       
       // Now safe to update the user's account
       // Use the existing purchasePackage controller logic here
       
       res.json({ success: true });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

## Security Best Practices

1. **Never store credit card details** in your database. Use Stripe to handle all payment information.

2. **Only store reference information** like Stripe payment intent IDs.

3. **Always verify payments on your server** by checking with Stripe directly before granting access to purchases.

4. **Use webhooks** to stay synchronized with payment status changes:
   - Set up a webhook endpoint in your server
   - Register this endpoint with Stripe
   - Process events like payment succeeded, failed, refunded, etc.

5. **Implement idempotency** to prevent duplicate charges if network issues occur.

6. **Use proper error handling** to ensure users aren't charged without receiving access to their purchase.

7. **Log all payment-related activity** for troubleshooting, but never log sensitive payment details.

## Testing

1. Use Stripe's test cards and test mode during development
2. Test various scenarios (successful payments, declines, errors)
3. Implement Stripe's radar rules for fraud detection in production

## Compliance

Ensure PCI compliance by:
1. Using Stripe Elements or Checkout
2. Never handling raw card data
3. Following Stripe's security recommendations
4. Keeping your dependencies updated 