// API URL for different environments
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.quantumbalance.co.uk/api'  // Production URL
  : 'http://localhost:5000/api';            // Development URL

// Other application constants
export const DEFAULT_AVATAR = '/assets/default-avatar.png';

// Website information
export const WEBSITE_NAME = 'Quantum Balance';
export const CONTACT_EMAIL = 'info@quantumbalance.co.uk'; 