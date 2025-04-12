import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { CreditCard, Plus, X, Trash2, ArrowLeft, AlertCircle, Edit, Save, CheckCircle, MapPin, Mail, Phone, User } from 'lucide-react';
import { API_URL } from '../../config/constants';

// UI components
import { Button } from '../../components/ui/FormElements';
import { Card } from '../../components/ui/Card';

// Get publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Country data with postal code labels
interface CountryData {
  code: string;
  name: string;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
}

// Common countries
const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', postalCodeLabel: 'ZIP Code', postalCodePlaceholder: '10001' },
  { code: 'CA', name: 'Canada', postalCodeLabel: 'Postal Code', postalCodePlaceholder: 'A1A 1A1' },
  { code: 'GB', name: 'United Kingdom', postalCodeLabel: 'Postcode', postalCodePlaceholder: 'SW1A 1AA' },
  { code: 'AU', name: 'Australia', postalCodeLabel: 'Postcode', postalCodePlaceholder: '2000' },
  { code: 'DE', name: 'Germany', postalCodeLabel: 'PLZ', postalCodePlaceholder: '10115' },
  { code: 'FR', name: 'France', postalCodeLabel: 'Code Postal', postalCodePlaceholder: '75001' },
  { code: 'IN', name: 'India', postalCodeLabel: 'PIN Code', postalCodePlaceholder: '110001' }
];

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BillingDetails {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }
}

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });
  const [editingBilling, setEditingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
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
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchPaymentMethods();
    fetchBillingDetails();
  }, []);
  
  // Update selected country when country selection changes
  useEffect(() => {
    const country = COUNTRIES.find(c => c.code === billingDetails.address.country);
    if (country) {
      setSelectedCountry(country);
    }
  }, [billingDetails.address.country]);
  
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
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
      } else {
        setError(response.data.message || 'Could not retrieve payment methods');
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };
  
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
      }
    } catch (err: any) {
      console.error('Error fetching billing details:', err);
      toast.error('Failed to load billing information');
    }
  };
  
  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/stripe/default-payment-method`,
        { paymentMethodId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        // Update the local state to reflect the new default
        setPaymentMethods(methods => 
          methods.map(method => ({
            ...method,
            isDefault: method.id === paymentMethodId
          }))
        );
        toast.success('Default payment method updated');
      } else {
        toast.error(response.data.message || 'Could not update default payment method');
      }
    } catch (err: any) {
      console.error('Error setting default payment method:', err);
      toast.error(err.response?.data?.message || 'Failed to set default payment method');
    }
  };
  
  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };
  
  const cancelDelete = () => {
    setDeleteId(null);
  };
  
  const handleDelete = async (paymentMethodId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/stripe/payment-methods/${paymentMethodId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        // Remove the deleted method from local state
        setPaymentMethods(methods => 
          methods.filter(method => method.id !== paymentMethodId)
        );
        toast.success('Payment method removed');
      } else {
        toast.error(response.data.message || 'Could not remove payment method');
      }
    } catch (err: any) {
      console.error('Error deleting payment method:', err);
      toast.error(err.response?.data?.message || 'Failed to delete payment method');
    } finally {
      setDeleteId(null);
    }
  };
  
  const handleBillingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like address.line1
      const [parent, child] = name.split('.');
      setBillingDetails(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      // Handle top-level properties
      setBillingDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const saveBillingDetails = async () => {
    try {
      setSavingBilling(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/stripe/billing-details`,
        billingDetails,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Billing details updated successfully');
        setEditingBilling(false);
      } else {
        toast.error(response.data.message || 'Could not update billing details');
      }
    } catch (err: any) {
      console.error('Error saving billing details:', err);
      toast.error(err.response?.data?.message || 'Failed to save billing details');
    } finally {
      setSavingBilling(false);
    }
  };
  
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
  
  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              onClick={() => navigate('/profile')}
              variant="secondary"
              className="mr-2 text-navy-300 hover:text-gold-500"
            >
              <ArrowLeft size={18} className="mr-1" />
              Back to Profile
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gold-500 mb-2">Payment & Billing</h1>
          <p className="text-navy-300">Manage your payment methods and billing information</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-center text-red-300">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Payment Methods */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-navy-800 border border-navy-700 overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-navy-700">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gold-500 mr-2" />
                  <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
                </div>
                
                {!showAddCard && (
                  <Button
                    onClick={() => setShowAddCard(true)}
                    variant="primary"
                    className="flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </Button>
                )}
              </div>
              
              <div className="p-5">
                {/* Add New Card Form */}
                <AnimatePresence>
                  {showAddCard && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 overflow-hidden"
                    >
                      <div className="bg-navy-700/50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-white">Add New Card</h3>
                          <Button 
                            onClick={() => setShowAddCard(false)} 
                            variant="secondary"
                            className="text-navy-300 hover:text-white p-1 h-auto"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                        
                        <Elements stripe={stripePromise}>
                          <AddCardForm 
                            onSuccess={() => {
                              fetchPaymentMethods();
                              setShowAddCard(false);
                            }}
                            onCancel={() => setShowAddCard(false)}
                          />
                        </Elements>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Payment Methods List */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8 bg-navy-800/70 rounded-lg border border-navy-700">
                      <CreditCard size={40} className="mx-auto mb-3 text-navy-500" />
                      <h3 className="text-lg font-medium text-navy-300 mb-1">No Payment Methods</h3>
                      <p className="text-navy-400 text-sm">
                        You haven't added any payment methods yet.
                      </p>
                      <Button 
                        onClick={() => setShowAddCard(true)}
                        variant="primary"
                        className="mt-4 flex items-center mx-auto"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Payment Method
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <motion.div
                          key={method.id}
                          variants={cardVariants}
                          className={`bg-navy-700/50 rounded-lg p-4 flex justify-between items-center ${
                            method.isDefault ? 'border border-gold-500/50' : 'border border-navy-600'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center">
                            {/* Card logo based on brand */}
                            <div className={`w-12 h-8 mr-4 flex items-center justify-center rounded-md ${
                              method.isDefault ? 'bg-gold-500/10' : 'bg-navy-600'
                            }`}>
                              <CreditCard 
                                size={24} 
                                className={method.isDefault ? 'text-gold-500' : 'text-white'} 
                              />
                            </div>
                            
                            <div>
                              <div className="text-white font-medium flex items-center">
                                {formatCardBrand(method.brand)} •••• {method.last4}
                                {method.isDefault && (
                                  <span className="ml-2 text-xs py-0.5 px-2 bg-gold-500/20 text-gold-400 rounded-full flex items-center">
                                    <CheckCircle size={12} className="mr-1" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-navy-400 text-sm">
                                Expires {method.expMonth}/{method.expYear}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {!method.isDefault && (
                              <Button
                                onClick={() => handleSetDefault(method.id)}
                                variant="secondary"
                                className="text-sm border-navy-600 hover:bg-navy-700"
                              >
                                Set Default
                              </Button>
                            )}
                            
                            {deleteId === method.id ? (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleDelete(method.id)}
                                  variant="danger"
                                  className="text-sm"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  onClick={cancelDelete}
                                  variant="secondary"
                                  className="text-sm border-navy-600"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => confirmDelete(method.id)}
                                variant="secondary"
                                className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </Card>
          </div>
          
          {/* Right Column - Billing Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-navy-800 border border-navy-700 overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-navy-700">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gold-500 mr-2" />
                  <h2 className="text-xl font-semibold text-white">Billing Information</h2>
                </div>
                
                {!editingBilling ? (
                  <Button
                    onClick={() => setEditingBilling(true)}
                    variant="secondary"
                    className="flex items-center text-sm"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    onClick={saveBillingDetails}
                    variant="primary"
                    className="flex items-center text-sm"
                    disabled={savingBilling}
                  >
                    {savingBilling ? (
                      <>
                        <span className="mr-2 h-3 w-3 border-2 border-navy-900 border-t-transparent rounded-full animate-spin"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} className="mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="p-5">
                {editingBilling ? (
                  // Billing details form
                  <div className="space-y-4">
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
                        className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
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
                          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>
                    </div>
                    
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
                        className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
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
                        value={billingDetails.address.line2}
                        onChange={handleBillingInputChange}
                        className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
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
                          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
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
                          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
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
                          placeholder={selectedCountry?.postalCodePlaceholder || ''}
                          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Billing details display
                  <div className="space-y-3">
                    {billingDetails.name || billingDetails.email || billingDetails.phone || 
                    billingDetails.address.line1 ? (
                      <>
                        <div className="flex items-start">
                          <User className="w-4 h-4 text-gold-500 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white font-medium">{billingDetails.name || 'Not provided'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Mail className="w-4 h-4 text-gold-500 mr-2 mt-0.5" />
                          <div className="text-navy-300">{billingDetails.email || 'Not provided'}</div>
                        </div>
                        
                        {billingDetails.phone && (
                          <div className="flex items-start">
                            <Phone className="w-4 h-4 text-gold-500 mr-2 mt-0.5" />
                            <div className="text-navy-300">{billingDetails.phone}</div>
                          </div>
                        )}
                        
                        {billingDetails.address.line1 && (
                          <div className="flex items-start mt-4 pt-4 border-t border-navy-700">
                            <MapPin className="w-4 h-4 text-gold-500 mr-2 mt-0.5" />
                            <div className="text-navy-300">
                              <div>{billingDetails.address.line1}</div>
                              {billingDetails.address.line2 && <div>{billingDetails.address.line2}</div>}
                              <div>{billingDetails.address.city}, {billingDetails.address.state} {billingDetails.address.postal_code}</div>
                              <div>
                                {COUNTRIES.find(c => c.code === billingDetails.address.country)?.name || 
                                  billingDetails.address.country}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <MapPin size={30} className="mx-auto mb-2 text-navy-500" />
                        <p className="text-navy-400 mb-2">No billing information provided</p>
                        <Button
                          onClick={() => setEditingBilling(true)}
                          variant="primary"
                          className="mt-2"
                        >
                          Add Billing Information
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Card Form Component
const AddCardForm = ({ 
  onSuccess, 
  onCancel 
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!billingDetails.name.trim()) {
        throw new Error('Please enter the name on card');
      }
      
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Create payment method
      const token = localStorage.getItem('token');
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email || undefined,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to add payment method');
      }
      
      // Save the payment method to the backend
      const response = await axios.post(
        `${API_URL}/stripe/payment-methods`,
        { paymentMethodId: paymentMethod.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Payment method added successfully');
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Could not save payment method');
      }
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };
  
  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        fontSize: '16px',
        '::placeholder': {
          color: '#8492a6',
        },
        iconColor: '#F7B538',
      },
      invalid: {
        color: '#f87171',
        iconColor: '#f87171',
      },
    },
    hidePostalCode: true
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-gray-300 text-xs mb-1">
          Name on Card <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={billingDetails.name}
          onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-gray-300 text-xs mb-1">
          Email (optional)
        </label>
        <input
          id="email"
          type="email"
          placeholder="johndoe@example.com"
          className="bg-navy-700/80 w-full px-3 py-2 text-white placeholder-gray-500 border border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={billingDetails.email}
          onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
        />
      </div>
      
      <div>
        <label htmlFor="card-element" className="block text-gray-300 text-xs mb-1">
          Card Details <span className="text-red-400">*</span>
        </label>
        <div className="bg-navy-700/80 p-3 border border-navy-600 rounded-md focus-within:ring-2 focus-within:ring-gold-500 transition-all">
          <CardElement 
            id="card-element" 
            options={cardElementOptions} 
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Test card: 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits
        </p>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          className="border-navy-600 hover:bg-navy-700 text-navy-300 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          variant="primary"
        >
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin"></span>
              Processing...
            </>
          ) : (
            <>Add Card</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PaymentMethodsPage; 