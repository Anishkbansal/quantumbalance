import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AVAILABLE_CURRENCIES, DEFAULT_CURRENCY, EXCHANGE_RATES } from '../config/constants';
import { getDefaultCurrency, convertCurrency } from '../utils/formatters';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/constants';

// Currency interface
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// Currency context interface
interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  availableCurrencies: Currency[];
  detectUserCurrency: () => void;
  convertPrice: (price: number, fromCurrency?: string) => number;
  exchangeRates: Record<string, number>;
}

// Create context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Provider props
interface CurrencyProviderProps {
  children: ReactNode;
}

// Find currency by code
const findCurrencyByCode = (code: string): Currency => {
  const currency = AVAILABLE_CURRENCIES.find(curr => curr.code === code);
  return currency || AVAILABLE_CURRENCIES.find(curr => curr.code === DEFAULT_CURRENCY)!;
};

// Currency provider component
export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { user } = useAuth() || {};
  const [currency, setCurrencyState] = useState<Currency>(
    findCurrencyByCode(localStorage.getItem('preferredCurrency') || DEFAULT_CURRENCY)
  );

  // Detect user's currency based on their locale
  const detectUserCurrency = () => {
    const detectedCurrency = getDefaultCurrency();
    setCurrency(detectedCurrency);
  };

  // Initialize from localStorage on first load
  useEffect(() => {
    if (user?.preferredCurrency) {
      // If user has a preferred currency in their profile, use that
      setCurrencyState(findCurrencyByCode(user.preferredCurrency));
    } else {
      const savedCurrency = localStorage.getItem('preferredCurrency');
      if (savedCurrency) {
        setCurrencyState(findCurrencyByCode(savedCurrency));
      } else {
        // Auto-detect currency on first visit
        detectUserCurrency();
      }
    }
  }, [user]);

  // Convert price from base currency (GBP) to selected currency
  const convertPrice = (price: number, fromCurrency: string = 'GBP'): number => {
    return convertCurrency(price, fromCurrency, currency.code, EXCHANGE_RATES);
  };

  // Set currency function
  const setCurrency = (currencyCode: string) => {
    const newCurrency = findCurrencyByCode(currencyCode);
    setCurrencyState(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency.code);

    // If user is logged in, save preference to their profile
    if (user) {
      axios.post(
        `${API_URL}/users/update-currency`, 
        { currency: newCurrency.code },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      ).catch(error => {
        console.error('Error saving currency preference:', error);
      });
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        availableCurrencies: AVAILABLE_CURRENCIES,
        detectUserCurrency,
        convertPrice,
        exchangeRates: EXCHANGE_RATES
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook for using currency context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext; 