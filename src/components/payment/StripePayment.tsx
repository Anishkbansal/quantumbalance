import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CreditCard, AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "../ui/FormElements";
import { Card } from "../ui/Card";
import { API_URL } from '../../config/constants';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../utils/formatters';

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
  currency?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  additionalData?: Record<string, any>;
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
  currency: propCurrency,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  additionalData
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currency: contextCurrency } = useCurrency();
  
  // Use the currency from props if provided, otherwise use the one from context
  const currency = propCurrency || contextCurrency.code;
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  
  // New state for manual payment
  const [isManualPayment, setIsManualPayment] = useState(false);
  
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
  const formattedPrice = formatCurrency(packagePrice, currency);
  
  // Fetch user's saved payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/stripe/payment-methods`,
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
        `${API_URL}/stripe/billing-details`,
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
  
  // Update createPaymentIntent to support gift card purchases
  const createPaymentIntent = async (methods: PaymentMethod[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Base request payload
      const requestPayload: any = { 
        packageId,
        countryCode: billingDetails.address.country,
        useExistingPaymentMethod: methods.length > 0 && !isManualPayment,
        currency
      };
      
      // For gift cards, include additional data
      if (packageId === 'gift-card') {
        requestPayload.amount = packagePrice;
        
        // Add recipient data from additionalData if available
        if (additionalData) {
          if (additionalData.recipientName) {
            requestPayload.recipientName = additionalData.recipientName;
          }
          if (additionalData.recipientEmail) {
            requestPayload.recipientEmail = additionalData.recipientEmail;
          }
          if (additionalData.message) {
            requestPayload.message = additionalData.message;
          }
        }
      }
      
      const response = await axios.post(
        `${API_URL}/stripe/create-payment-intent`,
        requestPayload,
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
  
  // Update handlePaymentSubmit to handle manual payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !clientSecret) {
      return;
    }
    
    if (!isManualPayment && !selectedPaymentMethodId) {
      setError('Please select a payment method or enter new card details.');
      return;
    }
    
    setShowConfirmDialog(true);
  };
  
  // Update processPayment to handle manual payment
  const processPayment = async () => {
    if (!stripe || !clientSecret) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (isManualPayment) {
        // For manual payment with new card
        const cardElement = elements?.getElement(CardElement);
        
        if (!cardElement) {
          throw new Error('Card element not found');
        }
        
        // Process with entered card
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingDetails.name,
              email: billingDetails.email,
              phone: billingDetails.phone,
              address: {
                line1: billingDetails.address.line1,
                line2: billingDetails.address.line2,
                city: billingDetails.address.city,
                state: billingDetails.address.state,
                postal_code: billingDetails.address.postal_code,
                country: billingDetails.address.country,
              }
            }
          }
        });
      } else {
        // For saved payment method
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethodId as string
        });
      }
      
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // Payment succeeded
          toast.success('Payment successful!');
          onPaymentSuccess(result.paymentIntent.id);
        } else {
          // Payment requires additional action
          toast.error('Payment requires additional verification. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onPaymentError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Handle billing details input changes
  const handleBillingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setBillingDetails(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Toggle between saved payment methods and manual payment
  const togglePaymentMode = () => {
    setIsManualPayment(prev => !prev);
    if (!isManualPayment) {
      setSelectedPaymentMethodId(null);
    }
  };

  // Handle card submission
  const handleSubmitCard = async () => {
    if (!stripe || !elements) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get CardElement
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
            address: {
              city: billingDetails.address.city,
              country: billingDetails.address.country,
              line1: billingDetails.address.line1,
              line2: billingDetails.address.line2,
              postal_code: billingDetails.address.postal_code,
              state: billingDetails.address.state,
            },
          },
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Payment failed');
      }
      
      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent.id);
        
        // For gift cards, we'll handle the creation in the parent component
        if (packageId === 'gift-card') {
          onPaymentSuccess(paymentIntent.id);
          return;
        }
        
        // For packages, call the API to confirm and provision
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_URL}/stripe/confirm-payment`,
          { 
            paymentIntentId: paymentIntent.id,
            packageId
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          onPaymentSuccess(paymentIntent.id);
        } else {
          throw new Error(response.data.message || 'Error confirming payment');
        }
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'There was an error processing your payment');
      onPaymentError(err.message || 'There was an error processing your payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Checkout: {packageName}</h3>
          <div className="text-xl font-bold text-gold-400">{formattedPrice}</div>
        </div>
        
        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-sm flex items-start"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>{error}</div>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          {/* Payment Method Toggle */}
          <div className="bg-navy-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 border-b border-navy-600 pb-2">
              <h4 className="text-white text-sm font-medium">Payment Method</h4>
              {paymentMethods.length > 0 && (
                <button
                  type="button"
                  onClick={togglePaymentMode}
                  className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {isManualPayment ? 'Use Saved Method' : 'Enter Card Details'}
                </button>
              )}
            </div>
            
            {loadingPaymentMethods ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
              </div>
            ) : !isManualPayment ? (
              /* Saved Payment Methods Section */
              paymentMethods.length === 0 ? (
                <div className="text-center py-6 bg-navy-800/50 rounded-lg">
                  <CreditCard size={36} className="mx-auto mb-3 text-navy-500" />
                  <h3 className="text-base font-medium text-navy-300 mb-2">No Payment Methods Found</h3>
                  <p className="text-navy-400 text-sm mb-4 max-w-xs mx-auto">
                    You need to add a payment method or enter your card details below.
                  </p>
                  <Button 
                    onClick={() => setIsManualPayment(true)}
                    variant="primary"
                  >
                    Enter Card Details
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
              )
            ) : (
              /* Manual Payment Form */
              <div className="space-y-5">
                <div className="p-3 bg-navy-800/70 rounded-lg border border-navy-600">
                  <div className="mb-4">
                    <label htmlFor="card-element" className="block text-sm font-medium text-gray-300 mb-1">
                      Card Details
                    </label>
                    <div className="bg-navy-700 p-3 rounded-md border border-navy-600 focus-within:border-gold-500">
                      <CardElement 
                        options={{
                          style: {
                            base: {
                              color: '#fff',
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '16px',
                              '::placeholder': {
                                color: '#64748b',
                              },
                            },
                            invalid: {
                              color: '#f87171',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Details Form */}
                <div className="bg-navy-800/70 rounded-lg border border-navy-600 p-4">
                  <h4 className="text-white text-sm font-medium mb-4 border-b border-navy-600 pb-2">
                    Billing Information
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-gray-300 text-xs mb-1">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={billingDetails.name}
                          onChange={handleBillingInputChange}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-gray-300 text-xs mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={billingDetails.email}
                          onChange={handleBillingInputChange}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-gray-300 text-xs mb-1">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={billingDetails.phone}
                        onChange={handleBillingInputChange}
                        className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    
                    {/* Address Information */}
                    <div>
                      <label htmlFor="address.line1" className="block text-gray-300 text-xs mb-1">
                        Address Line 1 <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="address.line1"
                        name="address.line1"
                        type="text"
                        value={billingDetails.address.line1}
                        onChange={handleBillingInputChange}
                        className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address.line2" className="block text-gray-300 text-xs mb-1">
                        Address Line 2
                      </label>
                      <input
                        id="address.line2"
                        name="address.line2"
                        type="text"
                        value={billingDetails.address.line2 || ''}
                        onChange={handleBillingInputChange}
                        className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="address.country" className="block text-gray-300 text-xs mb-1">
                          Country <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="address.country"
                          name="address.country"
                          value={billingDetails.address.country}
                          onChange={handleBillingInputChange}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        >
                          {COUNTRIES.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="address.postal_code" className="block text-gray-300 text-xs mb-1">
                          {selectedCountry?.postalCodeLabel || 'Postal Code'} <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="address.postal_code"
                          name="address.postal_code"
                          type="text"
                          value={billingDetails.address.postal_code}
                          onChange={handleBillingInputChange}
                          placeholder={selectedCountry?.postalCodePlaceholder}
                          pattern={selectedCountry?.postalCodePattern}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="address.city" className="block text-gray-300 text-xs mb-1">
                          City <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="address.city"
                          name="address.city"
                          type="text"
                          value={billingDetails.address.city}
                          onChange={handleBillingInputChange}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="address.state" className="block text-gray-300 text-xs mb-1">
                          State/Province <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="address.state"
                          name="address.state"
                          type="text"
                          value={billingDetails.address.state}
                          onChange={handleBillingInputChange}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <motion.div 
            className="flex justify-end mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-navy-600 hover:border-navy-500 rounded-md text-white mr-3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || !clientSecret || (!selectedPaymentMethodId && !isManualPayment)}
              className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 rounded-md text-navy-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formattedPrice}
            </button>
          </motion.div>
        </form>
      </div>
      
      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowConfirmDialog(false)}></div>
            <motion.div 
              className="bg-navy-800 border border-navy-600 rounded-lg p-6 w-full max-w-md relative z-10 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button 
                className="absolute top-3 right-3 text-navy-400 hover:text-white"
                onClick={() => setShowConfirmDialog(false)}
              >
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-3">Confirm Payment</h3>
              
              <div className="bg-navy-700/50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-navy-300">Package:</span>
                  <span className="text-white font-medium">{packageName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-navy-300">Amount:</span>
                  <span className="text-gold-400 font-bold">{formattedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-300">Payment Method:</span>
                  <span className="text-white">
                    {isManualPayment 
                      ? 'New Card' 
                      : `${formatCardBrand(paymentMethods.find(m => m.id === selectedPaymentMethodId)?.brand || '')} •••• 
                      ${paymentMethods.find(m => m.id === selectedPaymentMethodId)?.last4 || ''}`
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 border border-navy-600 hover:border-navy-500 rounded-md text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={processPayment}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 rounded-md text-navy-900 font-medium transition-colors flex items-center disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Payment
                      <ArrowRight size={16} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StripePayment; 