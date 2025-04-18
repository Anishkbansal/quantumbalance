import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Copy, CheckCircle2, XCircle, AlertTriangle, Calendar, User, Mail, Gift, Check, MessageSquare } from 'lucide-react';

interface GiftCardBuyer {
  _id: string;
  name: string;
  email: string;
}

interface GiftCardRecipient {
  name: string;
  email: string;
}

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
  recipient: GiftCardRecipient;
  buyer: GiftCardBuyer;
  createdAt: string;
  message?: string; // Optional message field
}

interface GiftCardsListProps {
  giftCards: GiftCard[];
  title: string;
  emptyMessage: string;
  showBuyer?: boolean;
  showRecipient?: boolean;
}

const GiftCardsList: React.FC<GiftCardsListProps> = ({ 
  giftCards, 
  title, 
  emptyMessage,
  showBuyer = true,
  showRecipient = true
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs font-medium">Active</span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center text-red-500 bg-red-500/10 px-2 py-1 rounded">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs font-medium">Expired</span>
          </div>
        );
      case 'exhausted':
        return (
          <div className="flex items-center text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs font-medium">Exhausted</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Get border color based on status
  const getCardBorderClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-blue-900/30';
      case 'expired':
        return 'border-red-900/30';
      case 'exhausted':
        return 'border-amber-900/30';
      default:
        return 'border-navy-700';
    }
  };

  const toggleCardExpand = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  return (
    <div className="bg-navy-800 rounded-lg shadow border border-navy-700 overflow-hidden">
      <div className="px-4 py-3 bg-navy-750 border-b border-navy-700">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Gift className="w-5 h-5 mr-2 text-gold-500" />
          {title}
        </h3>
      </div>

      {giftCards.length === 0 ? (
        <div className="py-6 px-4 text-center text-navy-400">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-navy-700">
          {giftCards.map(card => (
            <div 
              key={card._id} 
              className={`p-4 hover:bg-navy-750 transition-colors border-l-4 ${getCardBorderClass(card.status)}`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold">
                      {formatCurrency(card.amount, card.currency)}
                    </h4>
                    {getStatusBadge(card.status)}
                  </div>
                  
                  <div className="flex gap-3 items-center mt-2">
                    <div className="flex items-center bg-navy-700/80 rounded-lg overflow-hidden">
                      <div className="px-2 py-1 bg-navy-600 text-xs text-navy-300 font-medium">
                        CODE
                      </div>
                      <code className="px-2 py-1 font-mono text-sm text-white">
                        {card.code}
                      </code>
                      <button 
                        onClick={() => handleCopyCode(card.code)}
                        className={`flex items-center justify-center h-full px-2 transition-colors ${
                          copiedCode === card.code 
                            ? 'bg-emerald-600/20 text-emerald-400' 
                            : 'bg-navy-600/50 text-navy-300 hover:text-gold-400 hover:bg-navy-600'
                        }`}
                        title="Copy to clipboard"
                      >
                        {copiedCode === card.code ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {copiedCode === card.code && (
                      <span className="text-emerald-500 text-xs ml-1 animate-pulse">Copied!</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 text-sm text-navy-300">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-navy-400" />
                    <span>Expires: {formatDate(card.expiryDate)}</span>
                  </div>
                  
                  {card.status !== 'exhausted' && (
                    <div className="text-xs">
                      <span className="text-navy-400">
                        {card.status === 'active' ? 'Remaining: ' : 'Expired with: '}
                      </span>
                      <span className="text-white font-medium">
                        {formatCurrency(card.remainingBalance, card.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-2 text-sm">
                {showBuyer && card.buyer && (
                  <div className="bg-navy-700/50 px-3 py-2 rounded">
                    <div className="text-navy-400 mb-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>From</span>
                    </div>
                    <div className="text-white">{card.buyer?.name || 'Unknown'}</div>
                    <div className="text-navy-400 text-xs">{card.buyer?.email || 'No email'}</div>
                  </div>
                )}
                
                {showRecipient && (
                  <div className="bg-navy-700/50 px-3 py-2 rounded">
                    <div className="text-navy-400 mb-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>To</span>
                    </div>
                    <div className="text-white">{card.recipient.name}</div>
                    <div className="text-navy-400 text-xs">{card.recipient.email}</div>
                  </div>
                )}
                
                <div className="bg-navy-700/50 px-3 py-2 rounded">
                  <div className="text-navy-400 mb-0.5">Created</div>
                  <div className="text-white">{formatDate(card.createdAt)}</div>
                </div>
              </div>

              {/* Message section (if card has a message) */}
              {card.message && (
                <div className="mt-3 bg-navy-700/30 rounded-lg p-3 border border-navy-600">
                  <div className="flex items-center text-navy-300 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs font-medium">Message from sender</span>
                  </div>
                  <p className="text-white text-sm italic">"{card.message}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftCardsList; 