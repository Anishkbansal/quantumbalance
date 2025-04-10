import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CreditCard, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "../ui/FormElements";
import { Card } from "../ui/Card";

// Country data with postal code labels
interface CountryData {
  code: string;
  name: string;
  postalCodeLabel: string;
  postalCodePattern?: string;
  postalCodePlaceholder: string;
}

// Common countries with their specific postal code formats
const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', postalCodeLabel: 'ZIP Code', postalCodePlaceholder: '10001', postalCodePattern: '[0-9]{5}' },
  { code: 'CA', name: 'Canada', postalCodeLabel: 'Postal Code', postalCodePlaceholder: 'A1A 1A1', postalCodePattern: '[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]' },
  { code: 'GB', name: 'United Kingdom', postalCodeLabel: 'Postcode', postalCodePlaceholder: 'SW1A 1AA', postalCodePattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$' },
  { code: 'AU', name: 'Australia', postalCodeLabel: 'Postcode', postalCodePlaceholder: '2000', postalCodePattern: '[0-9]{4}' },
  { code: 'DE', name: 'Germany', postalCodeLabel: 'PLZ', postalCodePlaceholder: '10115', postalCodePattern: '[0-9]{5}' },
  { code: 'FR', name: 'France', postalCodeLabel: 'Code Postal', postalCodePlaceholder: '75001', postalCodePattern: '[0-9]{5}' },
  { code: 'IT', name: 'Italy', postalCodeLabel: 'CAP', postalCodePlaceholder: '00100', postalCodePattern: '[0-9]{5}' },
  { code: 'JP', name: 'Japan', postalCodeLabel: 'Postal Code', postalCodePlaceholder: '100-0001', postalCodePattern: '[0-9]{3}-[0-9]{4}' },
  { code: 'IN', name: 'India', postalCodeLabel: 'PIN Code', postalCodePlaceholder: '110001', postalCodePattern: '[0-9]{6}' },
  { code: 'BR', name: 'Brazil', postalCodeLabel: 'CEP', postalCodePlaceholder: '01000-000', postalCodePattern: '[0-9]{5}-[0-9]{3}' },
  { code: 'RU', name: 'Russia', postalCodeLabel: 'Postal Code', postalCodePlaceholder: '101000', postalCodePattern: '[0-9]{6}' },
  { code: 'CN', name: 'China', postalCodeLabel: 'Postal Code', postalCodePlaceholder: '100000', postalCodePattern: '[0-9]{6}' },
];

interface StripePaymentProps {
  packageId: string;
  packageName: string;
  packagePrice: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

interface BillingDetails {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    line2?: string;
  }
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  packageId,
  packageName,
  packagePrice,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  
  // Current selected country
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
  // Billing details - we'll still need this for the payment
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    name: '',
    email: '',
    phone: '',
    address: {
      city: '',
      country: 'US',
      line1: '',
      line2: '',
      postal_code: '',
      state: '',
    },
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  };
  
  // Format price as currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(packagePrice);
  
  // Fetch user's saved payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/stripe/payment-methods',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          setPaymentMethods(response.data.paymentMethods || []);
          
          // If there are payment methods and there's a default one, select it
          const defaultMethod = response.data.paymentMethods?.find((pm: PaymentMethod) => pm.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethodId(defaultMethod.id);
          } else if (response.data.paymentMethods?.length > 0) {
            setSelectedPaymentMethodId(response.data.paymentMethods[0].id);
          }
          
          // Fetch billing details after getting payment methods
          await fetchBillingDetails();
          
          // Create payment intent after fetching payment methods and billing details
          await createPaymentIntent(response.data.paymentMethods || []);
        } else {
          setError(response.data.message || 'Could not retrieve payment methods');
        }
      } catch (err: any) {
        console.error('Error fetching payment methods:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load payment methods');
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    
    fetchPaymentMethods();
  }, []);
  
  // Fetch user's billing details
  const fetchBillingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/stripe/billing-details',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success && response.data.billing) {
        setBillingDetails(response.data.billing);
        return response.data.billing;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching billing details:', err);
      toast.error('Failed to load billing information');
      return null;
    }
  };
  
  // Create a payment intent
  const createPaymentIntent = async (methods: PaymentMethod[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/stripe/create-payment-intent',
        { 
          packageId,
          countryCode: billingDetails.address.country,
          useExistingPaymentMethod: methods.length > 0
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId);
      } else {
        throw new Error(response.data.message || 'Error creating payment');
      }
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.response?.data?.message || err.message || 'Error setting up payment');
      onPaymentError(err.response?.data?.message || err.message || 'Error setting up payment');
    } finally {
      setLoading(false);
    }
  };
  
  // Update selected country when country selection changes
  useEffect(() => {
    const country = COUNTRIES.find(c => c.code === billingDetails.address.country);
    if (country) {
      setSelectedCountry(country);
    }
  }, [billingDetails.address.country]);
  
  // Function to format credit card brand name
  const formatCardBrand = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };
  
  // Handle payment submission
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !clientSecret) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedPaymentMethodId) {
        throw new Error('Please select a payment method');
      }
      
      // If we don't have a payment intent yet, create one
      if (!paymentIntentId) {
        await createPaymentIntent(paymentMethods);
      }
      
      // Show clear message to user that payment is being processed
      toast.loading('Processing your payment...', { id: 'payment-processing' });
      
      // Confirm the payment with Stripe using the saved payment method
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedPaymentMethodId
      });
      
      // Clear the loading toast
      toast.dismiss('payment-processing');
      
      if (result.error) {
        // Handle specific error cases with user-friendly messages
        let errorMessage = result.error.message || 'Payment failed';
        
        // Check for common error types and provide clearer messages
        if (result.error.type === 'card_error') {
          if (result.error.code === 'card_declined') {
            errorMessage = 'Your card was declined. Please try another payment method.';
          } else if (result.error.code === 'expired_card') {
            errorMessage = 'Your card has expired. Please try another card.';
          } else if (result.error.code === 'processing_error') {
            errorMessage = 'There was an error processing your card. Please try again later.';
          }
        } else if (result.error.type === 'validation_error') {
          errorMessage = 'There was a problem with your payment information. Please check and try again.';
        }
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } else if (result.paymentIntent) {
        // Check the specific status of the payment
        switch (result.paymentIntent.status) {
          case 'succeeded':
            toast.success('Payment successful!');
            // Payment succeeded, call success callback
            onPaymentSuccess(result.paymentIntent.id);
            break;
            
          case 'processing':
            toast.error('Your payment is still processing. We\'ll update you when it\'s confirmed.');
            setError('Your payment is processing. Please wait a moment and refresh the page to check the status.');
            break;
            
          case 'requires_payment_method':
            toast.error('Your payment was not successful. Please try again with a different payment method.');
            throw new Error('Payment failed. Please try another payment method.');
            
          default:
            toast.error('Something went wrong with your payment.');
            throw new Error(`Payment status: ${result.paymentIntent.status}. Please try again.`);
        }
      } else {
        toast.error('Payment not completed');
        throw new Error('Payment not completed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      
      // Show a toast error
      toast.error(err.message || 'Error processing payment');
      
      setError(err.message || 'Error processing payment');
      onPaymentError(err.message || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-navy-800/95 backdrop-filter backdrop-blur-sm rounded-lg p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto shadow-xl border border-navy-700/50">
      <motion.div 
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-white mb-1">Complete Your Purchase</h3>
        <p className="text-gray-300">
          {packageName} - {formattedPrice}
        </p>
      </motion.div>
      
      {error && (
        <motion.div 
          className="bg-red-900/40 text-red-300 p-3 rounded-md mb-4 text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>{error}</div>
          </div>
        </motion.div>
      )}
      
      <form onSubmit={handlePayment} className="space-y-5">
        {/* Payment Methods Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-navy-700/30 rounded-lg p-4 mb-6"
        >
          <h4 className="text-white text-sm font-medium mb-4 border-b border-navy-600 pb-2">
            Select Payment Method
          </h4>
          
          {loadingPaymentMethods ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-6 bg-navy-800/50 rounded-lg">
              <CreditCard size={36} className="mx-auto mb-3 text-navy-500" />
              <h3 className="text-base font-medium text-navy-300 mb-2">No Payment Methods Found</h3>
              <p className="text-navy-400 text-sm mb-4 max-w-xs mx-auto">
                You need to add a payment method in your profile before making a purchase.
              </p>
              <Button 
                onClick={() => navigate('/profile/payment-methods')}
                variant="primary"
                className="flex items-center mx-auto"
              >
                Add Payment Method
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  variants={cardVariants}
                  className={`bg-navy-700/80 rounded-lg p-3 flex justify-between items-center cursor-pointer ${
                    selectedPaymentMethodId === method.id 
                      ? 'border-2 border-gold-500/70' 
                      : 'border border-navy-600 hover:border-gold-500/30'
                  }`}
                  onClick={() => setSelectedPaymentMethodId(method.id)}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-8 mr-3 flex items-center justify-center rounded-md ${
                      method.isDefault ? 'bg-gold-500/10' : 'bg-navy-600'
                    }`}>
                      <CreditCard size={20} className={method.isDefault ? 'text-gold-500' : 'text-white'} />
                    </div>
                    
                    <div>
                      <div className="text-white text-sm font-medium flex items-center">
                        {formatCardBrand(method.brand)} •••• {method.last4}
                        {method.isDefault && (
                          <span className="ml-2 text-xs py-0.5 px-2 bg-gold-500/20 text-gold-400 rounded-full flex items-center">
                            <CheckCircle size={10} className="mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-navy-400 text-xs">
                        Expires {method.expMonth}/{method.expYear}
                      </div>
                    </div>
                  </div>
                  
                  {selectedPaymentMethodId === method.id && (
                    <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
                      <CheckCircle size={14} className="text-navy-900" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className="flex justify-end mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            type="submit"
            disabled={loading || !stripe || !clientSecret || !selectedPaymentMethodId || paymentMethods.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 rounded-md text-navy-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default StripePayment; 