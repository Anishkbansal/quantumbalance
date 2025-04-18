import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Gift, Loader2, Check } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/formatters';
import StripeWrapper from '../components/payment/StripeWrapper';
import { getMinAmounts } from '../services/giftCardService';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config/constants';
import axios from 'axios';

export default function GiftCards() {
  const navigate = useNavigate();
  const { currency, availableCurrencies, exchangeRates } = useCurrency();
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [minAmounts, setMinAmounts] = useState<Record<string, number>>({});
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentState, setPaymentState] = useState({
    success: false,
    message: '',
    giftCardCode: ''
  });
  
  // Fetch minimum amounts on component mount
  useEffect(() => {
    const fetchMinAmounts = async () => {
      try {
        setLoading(true);
        const amounts = await getMinAmounts();
        setMinAmounts(amounts);
        
        // Set a default amount as placeholder
        setAmount(String(amounts[currency.code] || 10));
      } catch (err) {
        setError('Failed to load minimum amounts. Please try again later.');
        console.error('Error loading minimum amounts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMinAmounts();
  }, [currency.code]);
  
  // Validate the amount is not below minimum
  const validateAmount = (): boolean => {
    const numericAmount = parseFloat(amount);
    const minAmount = minAmounts[currency.code] || 1;
    
    if (isNaN(numericAmount)) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numericAmount < minAmount) {
      setError(`Minimum amount for ${currency.code} is ${minAmount}`);
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientName) {
      setError('Please enter recipient name');
      return;
    }
    
    if (!recipientEmail) {
      setError('Please enter recipient email');
      return;
    }
    
    if (!validateAmount()) {
      return;
    }
    
    // Open payment modal
    setShowPaymentModal(true);
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input or valid numbers with up to 2 decimals
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Create the gift card after successful payment
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/stripe/confirm-gift-card`,
        {
          paymentIntentId: paymentId,
          recipientName,
          recipientEmail,
          amount: parseFloat(amount),
          currency: currency.code,
          message: message.trim() || undefined // Only send if not empty
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setShowPaymentModal(false);
        setPaymentState({
          success: true,
          message: 'Gift card purchased successfully!',
          giftCardCode: response.data.giftCard?.code || ''
        });
        
        // Reset form
        setAmount('');
        setRecipientName('');
        setRecipientEmail('');
        setMessage('');
      } else {
        setError(response.data.message || 'Failed to create gift card. Please contact support.');
      }
    } catch (err: any) {
      console.error('Error creating gift card:', err);
      setShowPaymentModal(false);
      setError(err.response?.data?.message || err.message || 'Failed to create gift card. Please try again later.');
    }
  };
  
  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setShowPaymentModal(false);
    setError(errorMessage || 'Payment failed. Please try again.');
  };
  
  // Handle payment cancel
  const handleCancelPayment = () => {
    setShowPaymentModal(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 to-navy-800 text-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Payment Modal */}
        {showPaymentModal && (
          <AnimatePresence>
            <motion.div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="relative max-w-md w-full"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {parseFloat(amount) > 0 && (
                  <StripeWrapper
                    packageId="gift-card"
                    packageName="Gift Card"
                    packagePrice={parseFloat(amount)}
                    currency={currency.code}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onCancel={handleCancelPayment}
                    additionalData={{
                      recipientName,
                      recipientEmail,
                      message: message.trim() || undefined
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Top section with title and description */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <Gift className="h-12 w-12 text-gold-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Gift Cards</h1>
          <p className="text-lg text-navy-300 max-w-2xl mx-auto">
            Send the gift of wellness to your loved ones. Our gift cards can be redeemed for any of our packages or services.
          </p>
        </div>
        
        {/* Success message */}
        {paymentState.success && (
          <motion.div 
            className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-6 mb-8 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-700 rounded-full p-1">
                <Check className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Purchase Successful!</h3>
            </div>
            <p className="text-navy-300 mb-4">
              Your gift card has been created and an email has been sent to {recipientEmail} with the gift card details.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setPaymentState({ success: false, message: '', giftCardCode: '' })}
                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-white transition-colors"
              >
                Purchase Another
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Error message */}
        {error && !paymentState.success && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {!paymentState.success && (
          <div className="bg-navy-800 rounded-lg shadow-xl border border-navy-700 max-w-lg mx-auto overflow-hidden">
            <div className="bg-navy-750 p-4 sm:p-6 border-b border-navy-700">
              <h2 className="text-xl font-semibold text-white">Purchase a Gift Card</h2>
              <p className="text-navy-300 text-sm mt-1">
                Fill out the details below to buy a gift card for someone special.
              </p>
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {/* Recipient Information */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium text-navy-300 mb-1">
                      Recipient Name
                    </label>
                    <input
                      id="recipientName"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder="Enter recipient's name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="recipientEmail" className="block text-sm font-medium text-navy-300 mb-1">
                      Recipient Email
                    </label>
                    <input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder="Enter recipient's email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-navy-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500 min-h-[80px] resize-y"
                      placeholder="Add a personal message for the recipient"
                      maxLength={200}
                    />
                    <p className="text-xs text-navy-400 mt-1">
                      {message.length}/200 characters
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-navy-300 mb-1">
                      Currency
                    </label>
                    <select
                      id="currency"
                      value={currency.code}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      disabled
                    >
                      {availableCurrencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-navy-400 mt-1">
                      Your current currency. Change in the currency selector if needed.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-navy-300 mb-1">
                      Amount ({currency.symbol})
                    </label>
                    <input
                      id="amount"
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder={`Minimum ${minAmounts[currency.code]} ${currency.code}`}
                      required
                    />
                    <p className="text-xs text-navy-400 mt-1">
                      Minimum amount: {currency.symbol}{minAmounts[currency.code] || '1'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Gift className="h-5 w-5" />
                    Purchase Gift Card
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 