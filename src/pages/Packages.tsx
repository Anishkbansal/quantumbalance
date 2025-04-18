import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Check, RefreshCw, Clock, ArrowRight, CreditCard, X, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/formatters';
import StripeWrapper from '../components/payment/StripeWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config/constants';

// Format date helper
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

interface PackageData {
  _id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features: string[];
  durationDays: number;
  maxPrescriptions: number;
  active: boolean;
  // UI-specific fields, not from backend
  period?: string;
  highlight?: boolean;
  badge?: string;
}

interface RenewalInfo {
  isEligible: boolean;
  currentPackage: {
    _id: string;
    type: string;
    name: string;
    expiryDate: string;
    daysRemaining: number;
    renewalEligibleDate: string;
  };
  renewalOptions: PackageData[];
}

export default function Packages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUserData } = useAuth();
  const { currency, setCurrency, availableCurrencies, convertPrice } = useCurrency();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [renewalInfo, setRenewalInfo] = useState<RenewalInfo | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Get package period text based on duration
  const getPackagePeriod = (durationDays: number, type: string) => {
    if (type === 'single') return 'one-time payment';
    if (durationDays <= 7) return 'weekly';
    if (durationDays <= 15) return 'for 15 days';
    if (durationDays <= 31) return 'per month';
    if (durationDays <= 90) return 'per quarter';
    return 'per year';
  };
  
  // Format amount using the user's preferred currency
  const formatAmount = (amount: number) => {
    // Convert the amount from GBP to the current currency and format it
    const convertedAmount = convertPrice(amount);
    return formatCurrency(convertedAmount, currency.code);
  };
  
  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };
  
  // Using useCallback to memoize these functions to avoid dependency issues
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/packages/all`);
      
      if (response.data.success) {
        // Process packages data to include UI-specific properties
        if (response.data.data.length === 0) {
          // If no packages found, try seeding them if user is admin
          if (user?.isAdmin) {
            // Instead of calling seedPackages, we'll do the API call directly here
            try {
              const seedResponse = await axios.post(
                `${API_URL}/packages/seed`,
                {},
                {
                  withCredentials: true,
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              
              if (seedResponse.data.success) {
                setSuccess('Packages created successfully');
                // Fetch packages again after seeding
                fetchPackages();
              } else {
                setError('Failed to seed packages');
              }
            } catch (seedErr: any) {
              console.error('Error seeding packages:', seedErr);
              setError('Error creating default packages. Please try again.');
            }
            return;
          } else {
            setError('No packages found. Please contact an administrator.');
          }
        } else {
          const processedPackages = response.data.data.map((pkg: PackageData) => ({
            ...pkg,
            period: getPackagePeriod(pkg.durationDays, pkg.type),
            // Only highlight the current active package, not enhanced by default
            highlight: Boolean(user?.packageType && user?.packageType === pkg.type),
            badge: pkg.type === 'premium' ? 'Best Value' : undefined
          }));
          
          setPackages(processedPackages);
        }
      } else {
        setError('Failed to fetch packages');
      }
    } catch (err: any) {
      console.error('Error fetching packages:', err);
      setError('Error loading packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchPackages();
    
    // Only check for renewal eligibility when user exists and only once
    if (user) {
      // Only do one check, not multiple
      checkRenewalEligibility();
    }
    
    // Check for messages in location state
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location]);

  // Check if user is eligible for renewal
  const checkRenewalEligibility = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/packages/user/renewal-eligibility`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        console.log('Renewal info:', response.data);
        setRenewalInfo(response.data);
        
        // If renewal is eligible, show a prominent message
        if (response.data.isEligible) {
          setSuccess(`Your package is about to expire! You can now renew it.`);
        }
      }
    } catch (err) {
      console.error('Error checking renewal eligibility:', err);
    }
  }, [user]);
  
  // Handle package renewal
  const handleRenewPackage = async (newPackageId: string) => {
    try {
      setIsRenewing(true);
      setError(null);
      
      const response = await axios.post(
        `${API_URL}/packages/user/renew`,
        {
          newPackageId,
          paymentMethod: 'credit_card'
        },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Package renewed successfully! Redirecting to dashboard...');
        
        // Refresh user data through Auth context
        if (typeof refreshUserData === 'function') {
          await refreshUserData();
        }
        
        // Navigate to dashboard after successful renewal
        setTimeout(() => {
          navigate('/dashboard', { state: { renewalSuccess: true } });
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to renew package');
      }
    } catch (error: any) {
      console.error('Error renewing package:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsRenewing(false);
    }
  };
  
  // Separate function just for the admin button to seed packages
  const handleSeedPackages = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post(
        `${API_URL}/packages/seed`,
        {},
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Packages created successfully');
        fetchPackages(); // Fetch the newly created packages
      } else {
        setError('Failed to seed packages');
      }
    } catch (err: any) {
      console.error('Error seeding packages:', err);
      setError('Error creating default packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle package selection
  const handleSelectPackage = (packageData: PackageData) => {
    // Check for user authentication
    if (!user) {
      navigate('/login', { 
        state: { 
          from: '/packages',
          message: 'Please log in to purchase a package'
        } 
      });
      return;
    }
    
    // Check if user's email is verified
    if (!user.isVerified) {
      setError('You must verify your email address before purchasing a package');
      // Show a more detailed error and provide a direct link to verification
      setTimeout(() => {
        if (window.confirm('Email verification required! Verify your email now to continue with your purchase?')) {
          navigate('/verify-email', {
            state: { 
              from: '/packages',
              message: 'Please verify your email to purchase a package'
            }
          });
        }
      }, 100);
      return;
    }
    
    // Store the selected package
    setSelectedPackage(packageData);
    
    // Instead of showing payment modal, redirect to questionnaire with package info
    navigate('/health-questionnaire', {
      state: {
        fromPackages: true,
        packageId: packageData._id,
        packageType: packageData.type,
        packageName: packageData.name,
        packagePrice: packageData.price,
        currency: currency.code
      }
    });
  };
  
  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };
  
  // Close payment modal
  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setError(null);
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
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={handleCancelPayment}
                    className="bg-navy-700 hover:bg-navy-600 text-white p-1.5 rounded-full transition-colors"
                    aria-label="Close payment form"
                  >
                    <X size={18} />
                  </button>
                </div>
                {selectedPackage && (
                  <StripeWrapper
                    packageId={selectedPackage._id}
                    packageName={selectedPackage.name}
                    packagePrice={selectedPackage.price}
                    currency={currency.code}
                    onPaymentSuccess={() => {}}
                    onPaymentError={handlePaymentError}
                    onCancel={handleCancelPayment}
                  />
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Top section with title and description */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">Select Your Healing Package</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the best package for your wellness journey and unleash the power of quantum balance.
          </p>
        </div>
        
        {/* Display error or success messages */}
        {error && (
          <div className="mt-6 mx-auto max-w-md p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && !renewalInfo?.isEligible && (
          <div className="mt-6 mx-auto max-w-md p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 flex items-start">
            <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}
        
        {/* Current package info banner */}
        {user?.packageType && user.packageType !== 'none' && (
          <div className="mb-8 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg text-indigo-300 flex items-start max-w-xl mx-auto">
            <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                You currently have the <span className="font-semibold text-white">
                  {user.packageType.charAt(0).toUpperCase() + user.packageType.slice(1)}
                </span> package active.
              </p>
              {user.activePackage && user.activePackage.expiresAt && (
                <p className="text-sm mt-1">
                  Expires: {new Date(user.activePackage.expiresAt).toLocaleDateString()}
                </p>
              )}
              <p className="mt-1">You can still upgrade to a different package if you wish.</p>
            </div>
          </div>
        )}

        {/* Currency selector - moved to above the packages grid */}
        <div className="mb-6 flex justify-end">
          <div className="flex items-center bg-navy-700 border border-navy-600 rounded-lg p-2">
            <Globe className="h-5 w-5 text-navy-300 mr-2" />
            <select
              value={currency.code}
              onChange={handleCurrencyChange}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              {availableCurrencies.map(curr => (
                <option 
                  key={curr.code} 
                  value={curr.code}
                  className="bg-navy-700 text-white"
                >
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center my-16">
            <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-navy-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Packages Available</h3>
            <p className="text-navy-300 text-center max-w-md mb-6">
              There are currently no healing packages available. Please check back later or contact an administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {packages.map((plan) => (
                <div 
                  key={plan._id}
                  className={`bg-navy-800 border ${
                    plan.highlight ? 'border-indigo-500' : 'border-navy-700'
                  } rounded-lg p-6 flex flex-col h-full relative ${
                    plan.highlight ? 'transform scale-105 z-10' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 -right-3 bg-gold-500 text-navy-900 text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gold-500">{formatAmount(plan.price)}</span>
                    <span className="text-navy-300 ml-1">{plan.period}</span>
                  </div>
                  
                  <p className="text-navy-300 text-sm mb-4">{plan.description}</p>
                  
                  <ul className="mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start mb-3">
                        <Check className="w-5 h-5 text-gold-500 mr-2 flex-shrink-0" />
                        <span className="text-navy-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleSelectPackage(plan)}
                    className={`w-full py-3 rounded-lg font-medium ${
                      plan.highlight 
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                        : 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                    } transition-colors ${loading || (user?.packageType && user?.packageType !== 'none' && !renewalInfo?.isEligible) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={Boolean(loading || (user?.packageType && user?.packageType !== 'none' && !renewalInfo?.isEligible))}
                  >
                    {loading ? 'Processing...' : user?.packageType === plan.type ? 'Current Plan' : (user?.packageType && user?.packageType !== 'none' && !renewalInfo?.isEligible) ? 'Unavailable' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
