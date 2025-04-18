import React, { useState, useEffect } from 'react';
import { getUserReceivedGiftCards } from '../../services/giftCardService';
import GiftCardsList from '../../components/gift-cards/GiftCardsList';
import { Loader2, Gift, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

type StatusFilter = 'all' | 'active' | 'expired' | 'exhausted';

const ProfileGiftCards: React.FC = () => {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const fetchGiftCards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch gift cards where the user is the recipient
        const cards = await getUserReceivedGiftCards();
        
        // Sort by creation date (newest first)
        const sortedCards = cards.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setGiftCards(sortedCards);
      } catch (err: any) {
        console.error('Error fetching gift cards:', err);
        setError('Failed to load gift cards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGiftCards();
  }, []);

  // Filter gift cards based on status
  const filteredGiftCards = giftCards.filter(card => {
    if (statusFilter === 'all') return true;
    return card.status === statusFilter;
  });

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">My Gift Cards</h2>
        <p className="text-navy-300">
          View and manage gift cards sent to you
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status filter */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center bg-navy-750 rounded-lg p-1 shadow border border-navy-700">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-navy-600 text-white' 
                    : 'text-navy-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === 'active' 
                    ? 'bg-navy-600 text-blue-400' 
                    : 'text-navy-300 hover:text-blue-400'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === 'expired' 
                    ? 'bg-navy-600 text-red-400' 
                    : 'text-navy-300 hover:text-red-400'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => setStatusFilter('exhausted')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === 'exhausted' 
                    ? 'bg-navy-600 text-amber-400' 
                    : 'text-navy-300 hover:text-amber-400'
                }`}
              >
                Exhausted
              </button>
            </div>
            <Filter className="w-4 h-4 text-navy-400" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GiftCardsList
              giftCards={filteredGiftCards}
              title={`Gift Cards (${filteredGiftCards.length})`}
              emptyMessage={
                statusFilter === 'all' 
                  ? "You don't have any gift cards yet." 
                  : `You don't have any ${statusFilter} gift cards.`
              }
              showBuyer={true}
              showRecipient={false}
            />
          </motion.div>
          
          <div className="flex justify-center">
            <a 
              href="/gift-cards"
              className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg flex items-center gap-2 hover:bg-gold-400 transition-colors"
            >
              <Gift className="w-4 h-4" />
              <span>Purchase Gift Cards</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileGiftCards; 