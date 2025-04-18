// API URL for different environments
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://quantumbalance.co.uk/api'  // Production URL
  : '/api';  // Use relative URL for development - this works for both local and hosted environments
            // Development URL

// Other application constants
export const DEFAULT_AVATAR = '/assets/default-avatar.png';

// Website information
export const WEBSITE_NAME = 'Quantum Balance';
export const CONTACT_EMAIL = 'info@quantumbalance.co.uk'; 

// Currency settings
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

// Default currency (can be overridden by user preferences or auto-detection)
export const DEFAULT_CURRENCY = 'GBP'; 

// Exchange rates with GBP as base currency
export const EXCHANGE_RATES = {
  GBP: 1.0,
  USD: 1.29,
  EUR: 1.18,
  CAD: 1.75,
  AUD: 1.93,
  JPY: 191.53,
  INR: 107.8, // 1 GBP = 107.8 INR
}; 
