import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AVAILABLE_CURRENCIES, DEFAULT_CURRENCY } from '../config/constants';
import { getDefaultCurrency } from '../utils/formatters';

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
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrencyState(findCurrencyByCode(savedCurrency));
    } else {
      // Auto-detect currency on first visit
      detectUserCurrency();
    }
  }, []);

  // Set currency function
  const setCurrency = (currencyCode: string) => {
    const newCurrency = findCurrencyByCode(currencyCode);
    setCurrencyState(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency.code);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        availableCurrencies: AVAILABLE_CURRENCIES,
        detectUserCurrency
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