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
];

// Default currency (can be overridden by user preferences or auto-detection)
export const DEFAULT_CURRENCY = 'GBP'; 
