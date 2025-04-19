import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, AlertCircle, Search, X, Loader2, Check, Copy, Plus, Info } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { useCurrency } from '../../contexts/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

interface GiftCard {
  _id: string;
  code: string;
  amount: number;
  currency: string;
  isRedeemed: boolean;
  amountUsed: number;
  remainingBalance: number;
  status: 'active' | 'expired' | 'exhausted';
  expiryDate: string;
  recipient: {
    name: string;
    email: string;
  };
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  message?: string;
  createdAt: string;
}

const AdminGiftCards: React.FC = () => {
  const navigate = useNavigate();
  const { currency, availableCurrencies } = useCurrency();
  
  // State for gift cards
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for creating gift cards
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code);
  const [message, setMessage] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);
  
  // State for gift card details
  const [activeGiftCard, setActiveGiftCard] = useState<GiftCard | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // State for search and filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Fetch gift cards on component mount
  useEffect(() => {
    fetchGiftCards();
  }, []);
  
  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Reset copied state after 3 seconds
  useEffect(() => {
    if (codeCopied) {
      const timer = setTimeout(() => {
        setCodeCopied(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [codeCopied]);
  
  // Fetch all gift cards
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/gift-cards/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setGiftCards(response.data.giftCards);
      } else {
        setError(response.data.message || 'Failed to fetch gift cards');
      }
    } catch (err: any) {
      console.error('Error fetching gift cards:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching gift cards');
    } finally {
      setLoading(false);
    }
  };
  
  // Create gift card for admin (no payment required)
  const createGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !recipientName || !recipientEmail || !selectedCurrency) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setCreatingCard(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/gift-cards/admin/create`,
        {
          amount: parseFloat(amount),
          recipientName,
          recipientEmail,
          currency: selectedCurrency,
          message: message.trim() || undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Gift card created successfully');
        
        // Close modal and reset form
        setShowCreateModal(false);
        resetForm();
        
        // Refresh gift card list
        fetchGiftCards();
      } else {
        setError(response.data.message || 'Failed to create gift card');
      }
    } catch (err: any) {
      console.error('Error creating gift card:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while creating gift card');
    } finally {
      setCreatingCard(false);
    }
  };
  
  // Reset create gift card form
  const resetForm = () => {
    setAmount('');
    setRecipientName('');
    setRecipientEmail('');
    setSelectedCurrency(currency.code);
    setMessage('');
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input or valid numbers with up to 2 decimals
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };
  
  // View gift card details
  const viewGiftCardDetails = (giftCard: GiftCard) => {
    setActiveGiftCard(giftCard);
    setShowDetailsModal(true);
  };
  
  // Copy gift card code to clipboard
  const copyGiftCardCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Filter gift cards based on search and status
  const filteredGiftCards = giftCards.filter(card => {
    // Filter by search term
    const searchMatch = 
      card.code.toLowerCase().includes(search.toLowerCase()) ||
      card.recipient.name.toLowerCase().includes(search.toLowerCase()) ||
      card.recipient.email.toLowerCase().includes(search.toLowerCase());
    
    // Filter by status
    const statusMatch = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && card.status === 'active') ||
      (statusFilter === 'expired' && card.status === 'expired') ||
      (statusFilter === 'exhausted' && card.status === 'exhausted');
    
    return searchMatch && statusMatch;
  });
  
  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gift Card Management</h1>
            <p className="text-navy-300 mt-1">Create and manage gift cards for users</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-600 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Gift Card
          </button>
        </div>
        
        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 flex items-start"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="bg-navy-800 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-navy-400" />
            </div>
            <input
              type="text"
              placeholder="Search by code, name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="exhausted">Exhausted</option>
            </select>
            
            <button
              onClick={fetchGiftCards}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded-lg text-white transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Gift Cards List */}
        {loading ? (
          <div className="bg-navy-800 rounded-lg p-8 flex justify-center items-center">
            <div className="animate-spin h-8 w-8 border-4 border-gold-500 border-t-transparent rounded-full"></div>
          </div>
        ) : giftCards.length === 0 ? (
          <div className="bg-navy-800 rounded-lg p-8 text-center">
            <Gift className="h-12 w-12 text-navy-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Gift Cards Found</h3>
            <p className="text-navy-300 mb-4">
              There are no gift cards in the system yet. Create your first gift card to get started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-600 transition-colors inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Gift Card
            </button>
          </div>
        ) : filteredGiftCards.length === 0 ? (
          <div className="bg-navy-800 rounded-lg p-8 text-center">
            <Search className="h-12 w-12 text-navy-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Results Found</h3>
            <p className="text-navy-300">
              No gift cards match your search criteria. Try a different search term or filter.
            </p>
          </div>
        ) : (
          <div className="bg-navy-800 rounded-lg border border-navy-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-navy-750">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Gift Card Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Recipient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Expiry</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-navy-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                  {filteredGiftCards.map((card) => (
                    <tr key={card._id} className="hover:bg-navy-750">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-mono text-white">{card.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-white">{card.recipient.name}</div>
                          <div className="text-navy-300 text-sm">{card.recipient.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white">
                          {formatCurrency(card.amount, card.currency)}
                        </div>
                        {card.amountUsed > 0 && (
                          <div className="text-navy-300 text-sm">
                            Used: {formatCurrency(card.amountUsed, card.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            card.status === 'active'
                              ? 'bg-green-900/30 text-green-400'
                              : card.status === 'expired'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-orange-900/30 text-orange-400'
                          }`}
                        >
                          {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-300">
                        {formatDate(card.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-navy-300">
                        {formatDate(card.expiryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewGiftCardDetails(card)}
                          className="text-gold-500 hover:text-gold-400"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Create Gift Card Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-navy-800 rounded-lg max-w-lg w-full shadow-xl border border-navy-700 max-h-[90vh] flex flex-col"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="flex justify-between items-center p-6 border-b border-navy-700 sticky top-0 bg-navy-800 z-10">
                  <h3 className="text-xl font-semibold text-white">Create Gift Card</h3>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="text-navy-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={createGiftCard} className="p-6 overflow-y-auto">
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="amount" className="block text-navy-300 mb-1">
                      Amount*
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="currency" className="block text-navy-300 mb-1">
                      Currency*
                    </label>
                    <select
                      id="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      required
                    >
                      {availableCurrencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="recipientName" className="block text-navy-300 mb-1">
                      Recipient Name*
                    </label>
                    <input
                      type="text"
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="recipientEmail" className="block text-navy-300 mb-1">
                      Recipient Email*
                    </label>
                    <input
                      type="email"
                      id="recipientEmail"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-navy-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Add a personal message..."
                      rows={3}
                      maxLength={200}
                    ></textarea>
                    <div className="text-right text-navy-400 text-xs mt-1">
                      {message.length}/200 characters
                    </div>
                  </div>
                  
                  <div className="flex justify-end sticky bottom-0 pt-6 mt-6 border-t border-navy-700 bg-navy-800 z-10">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingCard}
                      className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-600 flex items-center"
                    >
                      {creatingCard ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Create Gift Card
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Gift Card Details Modal */}
        <AnimatePresence>
          {showDetailsModal && activeGiftCard && (
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-navy-800 rounded-lg max-w-lg w-full shadow-xl border border-navy-700 max-h-[90vh] flex flex-col"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="flex justify-between items-center p-6 border-b border-navy-700 sticky top-0 bg-navy-800 z-10">
                  <h3 className="text-xl font-semibold text-white">Gift Card Details</h3>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="text-navy-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="mr-4 bg-gold-500/20 p-3 rounded-full">
                        <Gift className="h-6 w-6 text-gold-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {formatCurrency(activeGiftCard.amount, activeGiftCard.currency)} Gift Card
                        </h4>
                        <p className="text-navy-300">
                          Created on {formatDate(activeGiftCard.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeGiftCard.status === 'active'
                          ? 'bg-green-900/30 text-green-400'
                          : activeGiftCard.status === 'expired'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-orange-900/30 text-orange-400'
                      }`}
                    >
                      {activeGiftCard.status.charAt(0).toUpperCase() + activeGiftCard.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between bg-navy-750 p-4 rounded-lg border border-navy-700">
                      <div className="flex items-center">
                        <span className="font-mono text-lg text-white mr-2">{activeGiftCard.code}</span>
                      </div>
                      <button
                        onClick={() => copyGiftCardCode(activeGiftCard.code)}
                        className="flex items-center text-gold-500 hover:text-gold-400"
                      >
                        {codeCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    {activeGiftCard.status === 'active' && (
                      <p className="text-xs text-navy-400 mt-1 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Share this code with the recipient for redemption
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-navy-300 text-sm">Amount</p>
                        <p className="text-white">{formatCurrency(activeGiftCard.amount, activeGiftCard.currency)}</p>
                      </div>
                      <div>
                        <p className="text-navy-300 text-sm">Remaining Balance</p>
                        <p className="text-white">{formatCurrency(activeGiftCard.remainingBalance, activeGiftCard.currency)}</p>
                      </div>
                      <div>
                        <p className="text-navy-300 text-sm">Expiry Date</p>
                        <p className="text-white">{formatDate(activeGiftCard.expiryDate)}</p>
                      </div>
                      <div>
                        <p className="text-navy-300 text-sm">Redeemed</p>
                        <p className="text-white">{activeGiftCard.isRedeemed ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-navy-700">
                      <p className="text-navy-300 text-sm mb-1">Recipient</p>
                      <p className="text-white">{activeGiftCard.recipient.name}</p>
                      <p className="text-navy-300">{activeGiftCard.recipient.email}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-navy-700">
                      <p className="text-navy-300 text-sm mb-1">Created By</p>
                      <p className="text-white">{activeGiftCard.buyer.name}</p>
                      <p className="text-navy-300">{activeGiftCard.buyer.email}</p>
                    </div>
                    
                    {activeGiftCard.message && (
                      <div className="pt-4 border-t border-navy-700">
                        <p className="text-navy-300 text-sm mb-1">Message</p>
                        <p className="text-white bg-navy-750 p-3 rounded-lg border border-navy-700">
                          {activeGiftCard.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 border-t border-navy-700 flex justify-end sticky bottom-0 bg-navy-800 z-10">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminGiftCards; 