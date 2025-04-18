import React, { useState, useEffect } from 'react';
import { getUserReceivedGiftCards } from '../../services/giftCardService';
import { formatCurrency } from '../../utils/formatters';
import { Gift, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface GiftCardRedemptionProps {
  packagePrice: number;
  currency: string;
  onApplyGiftCard: (giftCardCode: string) => void;
  appliedGiftCard: any;
  onRemoveGiftCard: () => void;
}

const GiftCardRedemption: React.FC<GiftCardRedemptionProps> = ({
  packagePrice,
  currency,
  onApplyGiftCard,
  appliedGiftCard,
  onRemoveGiftCard
}) => {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { convertPrice } = useCurrency();

  useEffect(() => {
    const fetchGiftCards = async () => {
      try {
        setLoading(true);
        const cards = await getUserReceivedGiftCards();
        // Filter out only active gift cards
        const activeCards = cards.filter(card => card.status === 'active');
        setGiftCards(activeCards);
      } catch (err) {
        console.error('Error fetching gift cards:', err);
        setError('Failed to load your gift cards');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCards();
  }, []);

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Convert gift card value to user's preferred currency
  const getGiftCardValueInUserCurrency = (card: any) => {
    if (card.currency === currency) {
      return card.remainingBalance;
    }
    
    // Convert from card's currency to user's preferred currency
    // The convertPrice function converts from GBP to the target currency by default
    // or if given a value, it converts that value to the target currency
    if (card.currency === 'GBP') {
      // If card is in GBP, convert directly to user currency
      return convertPrice(card.remainingBalance);
    } else if (currency === 'GBP') {
      // If user currency is GBP, we need to convert from card currency to GBP
      // First get the conversion rate from GBP to card currency
      const rateToCardCurrency = convertPrice(1, card.currency);
      // Then convert back to GBP
      return card.remainingBalance / rateToCardCurrency;
    } else {
      // Both are non-GBP currencies - convert through GBP as the intermediate
      // First get card amount in GBP
      const rateToCardCurrency = convertPrice(1, card.currency);
      const amountInGBP = card.remainingBalance / rateToCardCurrency;
      // Then convert GBP to user currency
      return convertPrice(amountInGBP);
    }
  };

  if (appliedGiftCard) {
    const discountAmount = Math.min(appliedGiftCard.remainingBalance, packagePrice);
    const remainingToPay = Math.max(0, packagePrice - discountAmount);
    
    return (
      <div className="mb-3 rounded-md border border-gold-600/30 bg-navy-700/60 p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Gift className="text-gold-400 w-4 h-4 mr-2" />
            <div>
              <h3 className="text-white text-sm font-medium mb-0.5">
                Gift Card Applied: <span className="font-mono">{appliedGiftCard.code}</span>
              </h3>
              <p className="text-navy-300 text-xs">
                Discount: <span className="text-white">{formatCurrency(discountAmount, currency)}</span>
              </p>
              {remainingToPay > 0 && (
                <p className="text-navy-300 text-xs">
                  You'll pay: <span className="text-white">{formatCurrency(remainingToPay, currency)}</span>
                </p>
              )}
              {remainingToPay === 0 && (
                <p className="text-xs text-emerald-400 font-medium">Your order is free!</p>
              )}
            </div>
          </div>
          <button
            onClick={onRemoveGiftCard}
            className="p-1 rounded-full hover:bg-navy-600 text-navy-300 hover:text-white transition-colors"
            aria-label="Remove gift card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (giftCards.length === 0) {
    return null; // Don't show anything if there are no gift cards
  }

  return (
    <div className="mb-3 rounded-md border border-navy-600 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center bg-navy-750 p-2.5 hover:bg-navy-700 transition-colors"
      >
        <div className="flex items-center">
          <Gift className="text-gold-500 w-4 h-4 mr-2" />
          <span className="font-medium text-white text-sm">Use a Gift Card</span>
        </div>
        {expanded ? (
          <ChevronUp className="text-navy-300 w-4 h-4" />
        ) : (
          <ChevronDown className="text-navy-300 w-4 h-4" />
        )}
      </button>
      
      {expanded && (
        <div className="p-3 bg-navy-800">
          {loading ? (
            <p className="text-center text-navy-300 py-2 text-sm">Loading gift cards...</p>
          ) : error ? (
            <p className="text-center text-red-400 py-2 text-sm">{error}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-navy-300 text-xs mb-2">
                Select a gift card to apply to your purchase:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {giftCards.map(card => {
                  const valueInUserCurrency = getGiftCardValueInUserCurrency(card);
                  const formattedValue = formatCurrency(valueInUserCurrency, currency);
                  
                  return (
                    <button
                      key={card._id}
                      onClick={() => onApplyGiftCard(card.code)}
                      className="w-full flex justify-between items-center py-2 px-3 bg-navy-750 
                      hover:bg-navy-700 rounded-md border border-navy-600 transition-colors"
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex items-center">
                          <span className="font-mono text-white text-xs">{card.code}</span>
                          <span className="mx-2 text-navy-400">•</span>
                          <span className="text-gold-400 font-medium text-xs">{formattedValue}</span>
                        </div>
                        <div className="text-xs text-navy-400 mt-0.5">
                          Expires: {formatDate(card.expiryDate)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <span className="bg-navy-700 text-navy-300 hover:text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftCardRedemption; 