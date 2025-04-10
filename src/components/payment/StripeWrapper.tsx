import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePayment from './StripePayment';

// Get publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

// Make sure we have a key
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('Warning: Stripe publishable key is missing! Check your environment variables.');
}

// Load Stripe outside of components (singleton pattern)
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Add the ENV global to Window interface for future use
declare global {
  interface Window {
    ENV?: {
      STRIPE_PUBLISHABLE_KEY?: string;
    };
  }
}

interface StripeWrapperProps {
  packageId: string;
  packageName: string;
  packagePrice: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const StripeWrapper: React.FC<StripeWrapperProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePayment {...props} />
    </Elements>
  );
};

export default StripeWrapper; 