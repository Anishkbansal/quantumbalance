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
import { getGiftCardByCode, applyGiftCardToPackage } from '../../services/giftCardService';
import GiftCardRedemption from './GiftCardRedemption';

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

interface GiftCardDetails {
  code: string;
  amountToUse: number;
  currency: string;
}

interface ConfirmPaymentData {
  paymentIntentId: string;
  packageId: string;
  giftCardDetails?: GiftCardDetails;
  amount?: number;
  currency?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
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
  const { currency: contextCurrency, convertPrice } = useCurrency();
  
  // Use the currency from props if provided, otherwise use the one from context
  const currency = propCurrency || contextCurrency.code;
  
  // Calculate the converted price for this package (from GBP to selected currency)
  const convertedPrice = React.useMemo(() => {
    // For gift cards, use the price directly as it's already in the selected currency
    if (packageId === 'gift-card') {
      return packagePrice;
    }
    // For regular packages, convert from GBP to selected currency
    return Math.round(convertPrice(packagePrice));
  }, [packageId, packagePrice, convertPrice, currency]);
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'saved' | 'new'>('saved');
  
  // Current selected country
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);
  const [applyingGiftCard, setApplyingGiftCard] = useState(false);
  const [effectivePrice, setEffectivePrice] = useState(convertedPrice);
  
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
  const formattedPrice = formatCurrency(convertedPrice, currency);
  const formattedEffectivePrice = formatCurrency(effectivePrice, currency);
  
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
          const methods = response.data.paymentMethods || [];
          setPaymentMethods(methods);
          
          // If there are payment methods and there's a default one, select it
          const defaultMethod = methods.find((pm: PaymentMethod) => pm.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethodId(defaultMethod.id);
          } else if (methods.length > 0) {
            setSelectedPaymentMethodId(methods[0].id);
          }
          
          // Set the active tab based on available methods
          if (methods.length === 0) {
            setActiveTab('new');
          }
          
          // Fetch billing details after getting payment methods
          await fetchBillingDetails();
          
          // Create payment intent after fetching payment methods and billing details
          await createPaymentIntent(methods);
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
  
  useEffect(() => {
    if (clientSecret && effectivePrice !== convertedPrice) {
      updatePaymentIntent();
    }
  }, [effectivePrice, clientSecret]);
  
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
  
  const createPaymentIntent = async (methods: PaymentMethod[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Base request payload
      const requestPayload: any = { 
        packageId,
        countryCode: billingDetails.address.country,
        useExistingPaymentMethod: methods.length > 0 && activeTab !== 'new',
        currency,
        convertedPrice: effectivePrice
      };
      
      // For gift cards, include additional data
      if (packageId === 'gift-card') {
        // Use packagePrice as amount since effectivePrice won't apply to the initial intent
        requestPayload.amount = packagePrice;
        if (additionalData) {
          requestPayload.recipientName = additionalData.recipientName;
          requestPayload.recipientEmail = additionalData.recipientEmail;
          requestPayload.message = additionalData.message;
        }
        // For gift cards, send the original packagePrice as convertedPrice initially
        requestPayload.convertedPrice = packagePrice; 
      }
      
      // If a gift card is ALREADY applied when creating the intent (less common, but possible)
      if (appliedGiftCard) {
        requestPayload.giftCardCode = appliedGiftCard.code;
      }
      
      console.log('Creating Payment Intent Payload:', requestPayload);

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
  
  const updatePaymentIntent = async () => {
    if (!paymentIntentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log(`Updating Payment Intent ${paymentIntentId} with amount ${effectivePrice}`);

      const response = await axios.post(
        `${API_URL}/stripe/update-payment-intent`,
        {
          paymentIntentId,
          amount: effectivePrice,
          currency
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
        console.log('Payment Intent updated successfully');
      } else {
        setError(response.data.message || 'Could not update payment amount');
        toast.error('Failed to update payment amount after applying gift card.');
      }
    } catch (err: any) {
      console.error('Error updating payment intent:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update payment amount');
      toast.error('An error occurred while updating the payment amount.');
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
  
  // Update handlePaymentSubmit to handle the active tab
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !clientSecret) {
      return;
    }
    
    if (activeTab === 'saved' && !selectedPaymentMethodId) {
      setError('Please select a payment method or switch to the "Add New Card" tab.');
      return;
    }
    
    setShowConfirmDialog(true);
  };
  
  const processPayment = async () => {
    if (!stripe || !clientSecret) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (activeTab === 'new') {
        const cardElement = elements?.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');
        
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
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethodId as string
        });
      }
      
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // Payment succeeded - Now confirm with backend, potentially applying gift card
          const token = localStorage.getItem('token');
          let confirmEndpoint = `${API_URL}/stripe/confirm-payment`;
          let confirmData: ConfirmPaymentData = {
            paymentIntentId: result.paymentIntent.id,
            packageId
          };

          // If a gift card was applied, include its details for final application
          if (appliedGiftCard) {
            const discountAmount = Math.min(appliedGiftCard.remainingBalance, convertedPrice);
            confirmData = {
              ...confirmData,
              giftCardDetails: {
                code: appliedGiftCard.code,
                amountToUse: discountAmount,
                currency: appliedGiftCard.currency
              }
            };
          }
          
          // Check if this is a gift card purchase itself
          if (packageId === 'gift-card') {
            confirmEndpoint = `${API_URL}/stripe/confirm-gift-card`; 
            confirmData = {
              ...confirmData,
              amount: packagePrice,
              currency,
              recipientName: additionalData?.recipientName,
              recipientEmail: additionalData?.recipientEmail,
              message: additionalData?.message
            };
          }

          console.log('Confirming Payment with Backend Data:', confirmData);
          
          const confirmResponse = await axios.post(
            confirmEndpoint,
            confirmData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (confirmResponse.data.success) {
            toast.success('Payment successful!');
            onPaymentSuccess(result.paymentIntent.id);
          } else {
            throw new Error(confirmResponse.data.message || 'Failed to confirm purchase with backend');
          }
        } else {
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

  const handleApplyGiftCard = async (giftCardCode: string) => {
    if (packageId === 'gift-card') {
      toast.error("Cannot apply a gift card to a gift card purchase.");
      return;
    }
    try {
      setApplyingGiftCard(true);
      setError(null);
      
      const result = await applyGiftCardToPackage(
        giftCardCode,
        packageId,
        convertedPrice,
        currency
      );
      
      if (result.success) {
        setAppliedGiftCard(result.giftCard);
        setEffectivePrice(result.amountToCharge || 0);
        toast.success("Gift card applied successfully!");
      } else {
        toast.error(result.message || "Failed to apply gift card");
      }
    } catch (err: any) {
      console.error('Error applying gift card:', err);
      toast.error(err.message || "An error occurred while applying the gift card");
    } finally {
      setApplyingGiftCard(false);
    }
  };
  
  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setEffectivePrice(convertedPrice);
    toast.success("Gift card removed");
  };

  return (
    <div className="w-full max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-navy-600 scrollbar-track-navy-800">
      <div className="p-5 md:p-8"> 
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-navy-700">
          <h3 className="text-xl font-semibold text-white mb-2 sm:mb-0">Checkout: {packageName}</h3>
          <div className="text-lg font-semibold text-gold-400">
            {appliedGiftCard ? `Total: ${formattedEffectivePrice}` : `Total: ${formattedPrice}`}
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-start shadow-md"
          >
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {packageId !== 'gift-card' && (
          <motion.div variants={cardVariants} className="mb-6">
            <GiftCardRedemption
              packagePrice={convertedPrice}
              currency={currency}
              onApplyGiftCard={handleApplyGiftCard}
              appliedGiftCard={appliedGiftCard}
              onRemoveGiftCard={handleRemoveGiftCard}
            />
          </motion.div>
        )}

        {effectivePrice > 0 ? (
          <form onSubmit={handlePaymentSubmit} className="space-y-8">
            <motion.div variants={cardVariants} className="bg-navy-700/40 rounded-lg p-5 border border-navy-600/70 shadow-sm">
              <h4 className="text-base font-semibold text-white mb-5">Payment Method</h4>
              
              {paymentMethods.length > 0 && (
                <div className="flex space-x-4 border-b border-navy-600 mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className={`pb-2 px-1 text-sm transition-colors ${ 
                      activeTab === 'saved' 
                        ? 'text-gold-400 border-b-2 border-gold-400 font-medium' 
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Saved Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('new')}
                    className={`pb-2 px-1 text-sm transition-colors ${ 
                      activeTab === 'new' 
                        ? 'text-gold-400 border-b-2 border-gold-400 font-medium' 
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Add New Card
                  </button>
                </div>
              )}
              
              {loadingPaymentMethods ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === 'saved' && paymentMethods.length > 0 && (
                    <motion.div 
                      key="saved-cards"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`rounded-md p-3 flex justify-between items-center cursor-pointer border transition-colors duration-150 ${ 
                            selectedPaymentMethodId === method.id 
                              ? 'bg-navy-600/50 border-gold-500/80 shadow-md' 
                              : 'bg-navy-700/60 border-navy-600 hover:border-navy-500'
                          }`}
                          onClick={() => setSelectedPaymentMethodId(method.id)}
                        >
                          <div className="flex items-center">
                            <CreditCard size={18} className={`mr-3 ${selectedPaymentMethodId === method.id ? 'text-gold-400' : 'text-navy-300'}`} />
                            <div>
                              <span className="text-white text-sm font-medium">
                                {formatCardBrand(method.brand)} •••• {method.last4}
                              </span>
                              <span className="text-navy-400 text-xs block"> 
                                Expires {method.expMonth}/{method.expYear}
                              </span>
                            </div>
                          </div>
                          {method.isDefault && selectedPaymentMethodId !== method.id && (
                             <span className="text-[11px] py-0.5 px-2 bg-navy-600 text-navy-300 rounded-full">
                                Default
                              </span>
                          )}
                          {selectedPaymentMethodId === method.id && (
                            <CheckCircle size={18} className="text-gold-400" />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                  
                  {(activeTab === 'new' || paymentMethods.length === 0) && (
                    <motion.div 
                      key="new-card"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <label htmlFor="card-element" className="block text-sm font-medium text-gray-300 mb-1.5">
                          Card Details
                        </label>
                        <div className="p-3 bg-navy-900/50 border border-navy-600 rounded-md focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-all">
                          <CardElement 
                            id="card-element"
                            options={{
                              style: {
                                base: {
                                  color: '#FFFFFF',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '15px',
                                  fontSmoothing: 'antialiased',
                                  '::placeholder': {
                                    color: '#94a3b8',
                                  },
                                },
                                invalid: {
                                  color: '#f87171', 
                                  iconColor: '#f87171'
                                },
                              },
                              hidePostalCode: true,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <h5 className="text-base font-medium text-white mb-4">Billing Information</h5>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Full Name" id="name" name="name" value={billingDetails.name} onChange={handleBillingInputChange} required />
                            <InputField label="Email" id="email" name="email" type="email" value={billingDetails.email} onChange={handleBillingInputChange} required />
                          </div>
                          
                          <InputField label="Phone Number" id="phone" name="phone" type="tel" value={billingDetails.phone} onChange={handleBillingInputChange} />
                          
                          <InputField label="Address Line 1" id="address.line1" name="address.line1" value={billingDetails.address.line1} onChange={handleBillingInputChange} required />
                          <InputField label="Address Line 2 (Optional)" id="address.line2" name="address.line2" value={billingDetails.address.line2 || ''} onChange={handleBillingInputChange} />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="City" id="address.city" name="address.city" value={billingDetails.address.city} onChange={handleBillingInputChange} required />
                            <InputField label="State / Province" id="address.state" name="address.state" value={billingDetails.address.state} onChange={handleBillingInputChange} required />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="address.country" className="block text-xs font-medium text-gray-300 mb-1.5">
                                Country <span className="text-red-400">*</span>
                              </label>
                              <select
                                id="address.country"
                                name="address.country"
                                value={billingDetails.address.country}
                                onChange={handleBillingInputChange}
                                className="w-full px-3 py-2.5 bg-navy-900/50 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors text-sm"
                                required
                              >
                                {COUNTRIES.map(country => (
                                  <option key={country.code} value={country.code}>
                                    {country.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                             <InputField 
                                label={selectedCountry?.postalCodeLabel || 'Postal Code'} 
                                id="address.postal_code" 
                                name="address.postal_code" 
                                value={billingDetails.address.postal_code} 
                                onChange={handleBillingInputChange} 
                                placeholder={selectedCountry?.postalCodePlaceholder} 
                                pattern={selectedCountry?.postalCodePattern} 
                                required 
                              />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row justify-end items-center pt-6 border-t border-navy-700 space-y-3 sm:space-y-0 sm:space-x-4"
              variants={cardVariants}
            >
              <Button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 text-sm bg-navy-600 hover:bg-navy-500 border border-navy-500 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !stripe || !clientSecret || (activeTab === 'saved' && !selectedPaymentMethodId)}
                className="w-full sm:w-auto px-6 py-2.5 text-sm flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {formattedEffectivePrice}
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        ) : (
          <motion.div variants={cardVariants} className="text-center">
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-6 mb-6 flex flex-col items-center shadow-md">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Your order is free!</h3>
              <p className="text-emerald-300 text-sm max-w-xs mx-auto">
                The applied gift card covers the full amount. Click below to complete your order.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                 type="button"
                 onClick={processPayment}
                 disabled={loading}
                 variant="secondary"
                 className="w-full sm:w-auto px-6 py-3 text-base flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
               <Button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 text-sm bg-navy-600 hover:bg-navy-500 border border-navy-500 text-white"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

      </div>
      
      <AnimatePresence>
        {showConfirmDialog && effectivePrice > 0 && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-navy-800 border border-navy-600 rounded-lg p-6 w-full max-w-sm relative shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
              <button 
                className="absolute top-2 right-2 text-navy-400 hover:text-white p-1.5 bg-navy-700/50 hover:bg-navy-700 rounded-full transition-colors"
                onClick={() => setShowConfirmDialog(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Your Payment</h3>
              
              <div className="bg-navy-700/40 border border-navy-600/70 p-4 rounded-md mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-navy-300">Package:</span>
                  <span className="text-white font-medium">{packageName}</span>
                </div>
                 {appliedGiftCard && (
                   <div className="flex justify-between text-emerald-400">
                      <span className="text-emerald-400/80">Gift Card Discount:</span>
                      <span className="font-medium">-{formatCurrency(convertedPrice - effectivePrice, currency)}</span>
                   </div>
                 )}
                <div className="flex justify-between pt-2 border-t border-navy-600">
                  <span className="text-navy-300 font-medium">Amount to Pay:</span>
                  <span className="text-gold-400 font-bold text-base">{formattedEffectivePrice}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-navy-400">Payment Method:</span>
                  <span className="text-white">
                    {activeTab === 'new' 
                      ? 'New Card' 
                      : `${formatCardBrand(paymentMethods.find(m => m.id === selectedPaymentMethodId)?.brand || '')} •••• ${paymentMethods.find(m => m.id === selectedPaymentMethodId)?.last4 || ''}`}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-5 py-2 text-sm bg-navy-600 hover:bg-navy-500 border border-navy-500 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={processPayment}
                  disabled={loading}
                  className="px-6 py-2 text-sm flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm & Pay
                      <ArrowRight size={16} className="ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-gray-300 mb-1.5">
      {label} {props.required && <span className="text-red-400">*</span>}
    </label>
    <input
      id={id}
      {...props}
      className="w-full px-3 py-2.5 bg-navy-900/50 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors text-sm"
    />
  </div>
);

export default StripePayment; 