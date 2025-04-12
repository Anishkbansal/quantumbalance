import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ChevronDown } from 'lucide-react';

interface CurrencySelectorProps {
  className?: string;
  dropdownPosition?: 'left' | 'right';
  minimal?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  className = '',
  dropdownPosition = 'right',
  minimal = false
}) => {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Current currency display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-2 py-1 rounded-md border transition-colors ${
          minimal 
            ? 'border-transparent hover:bg-navy-700/50 text-navy-300 hover:text-white' 
            : 'border-navy-700 bg-navy-800 hover:bg-navy-700 text-white'
        }`}
        aria-label="Select currency"
      >
        {minimal ? (
          <span className="flex items-center">
            {currency.code} <ChevronDown size={16} className="ml-1" />
          </span>
        ) : (
          <span className="flex items-center">
            <span className="mr-1">{currency.symbol}</span>
            <span className="mr-1">{currency.code}</span>
            <ChevronDown size={16} />
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-1 py-1 bg-navy-800 border border-navy-700 rounded-md shadow-lg overflow-hidden w-40 ${
            dropdownPosition === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {availableCurrencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-navy-700 transition-colors flex items-center space-x-2 ${
                curr.code === currency.code 
                  ? 'bg-navy-700/50 text-gold-500' 
                  : 'text-white'
              }`}
            >
              <span className="w-6">{curr.symbol}</span>
              <span>{curr.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector; 