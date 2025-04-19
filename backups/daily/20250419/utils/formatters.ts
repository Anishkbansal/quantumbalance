/**
 * Utility functions for data formatting and processing
 */

// Format a key string to be more readable
export function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ');
}

// Format a date for display
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

// Extract basic info from questionnaire data
export function getBasicInfo(data: any) {
  if (!data) return {};
  
  return {
    isPregnant: data.isPregnant ? 'Yes' : 'No',
    age: data.age || 'Not specified',
    gender: data.gender || 'Not specified',
    height: data.height || 'Not specified',
    weight: data.weight || 'Not specified',
  };
}

// Check if health concerns exist
export function hasHealthConcerns(data: any): boolean {
  if (!data) return false;
  return Array.isArray(data.healthConcerns) && data.healthConcerns.length > 0;
}

// Get health concerns from data
export function getHealthConcerns(data: any) {
  if (!data || !Array.isArray(data.healthConcerns)) return {};
  
  // Convert array of health concerns to an object for display
  const concerns: Record<string, any> = {};
  data.healthConcerns.forEach((concern: any, index: number) => {
    if (concern && concern.description) {
      concerns[`concern_${index}`] = concern.description;
    }
  });
  
  return concerns;
}

// Check if pain locations exist
export function hasPainLocations(data: any): boolean {
  if (!data) return false;
  return Array.isArray(data.painLocations) && data.painLocations.length > 0;
}

// Get pain locations from data
export function getPainLocations(data: any) {
  if (!data || !Array.isArray(data.painLocations)) return {};
  
  // Convert array of pain locations to an object for display
  const locations: Record<string, any> = {};
  data.painLocations.forEach((location: string, index: number) => {
    locations[`location_${index}`] = location;
  });
  
  // Include other pain location if present
  if (data.otherPainLocation) {
    locations['other'] = data.otherPainLocation;
  }
  
  return locations;
}

// Check if emotional wellbeing data exists
export function hasEmotionalWellbeing(data: any): boolean {
  if (!data) return false;
  return data.emotionalState && data.emotionalState.length > 0;
}

// Get emotional wellbeing data
export function getEmotionalWellbeing(data: any) {
  if (!data || !data.emotionalState) return {};
  
  // Convert emotional state to an object for display
  return { emotionalState: data.emotionalState };
}

// Check if environmental factors exist
export function hasEnvironmentalFactors(data: any): boolean {
  if (!data) return false;
  return (data.toxinExposure && data.toxinExposure.length > 0) || 
         (data.lifestyleFactors && data.lifestyleFactors.length > 0);
}

// Get environmental factors
export function getEnvironmentalFactors(data: any) {
  if (!data) return {};
  
  const factors: Record<string, any> = {};
  
  // Add toxin exposures
  if (Array.isArray(data.toxinExposure)) {
    data.toxinExposure.forEach((factor: string, index: number) => {
      factors[`toxin_${index}`] = factor;
    });
  }
  
  // Add lifestyle factors
  if (Array.isArray(data.lifestyleFactors)) {
    data.lifestyleFactors.forEach((factor: string, index: number) => {
      factors[`lifestyle_${index}`] = factor;
    });
  }
  
  return factors;
}

// Check if healing goals exist
export function hasHealingGoals(data: any): boolean {
  if (!data) return false;
  return data.healingGoals && Array.isArray(data.healingGoals) && data.healingGoals.length > 0;
}

// Get healing goals
export function getHealingGoals(data: any) {
  if (!data || !Array.isArray(data.healingGoals)) return {};
  
  const goals: Record<string, any> = {};
  data.healingGoals.forEach((goal: string, index: number) => {
    goals[`goal_${index}`] = goal;
  });
  
  return goals;
}

// Convert a file to base64 string
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Get package features by type
export function getFeaturesByType(type: string): string[] {
  switch (type) {
    case 'single': 
      return ['Two prescriptions', '3-day access', 'Basic support'];
    case 'basic': 
      return ['Four prescriptions', '15-day access', 'Basic support'];
    case 'enhanced': 
      return ['Seven prescriptions', '30-day access', 'Basic support'];
    case 'premium': 
      return ['Unlimited prescriptions', '30-day access', 'Priority support', 'Custom healing programs'];
    default: 
      return ['Basic features'];
  }
}

/**
 * Format a number as a currency string
 * @param amount - The amount to format
 * @param currencyCode - The ISO 4217 currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency code (default: GBP)
 * @param toCurrency - The target currency code
 * @param exchangeRates - The exchange rates object
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'GBP',
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return Math.round(amount);
  }

  // Convert from source currency to target currency
  const convertedAmount = (amount * exchangeRates[toCurrency]) / exchangeRates[fromCurrency];
  
  // Round to nearest whole number for all currencies
  return Math.round(convertedAmount);
}

/**
 * Get default currency based on user's browser locale
 * @returns The currency code (default: USD)
 */
export function getDefaultCurrency(): string {
  // This is a simple mapping of common locales to currencies
  const localeCurrencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'en-NZ': 'NZD',
    'de': 'EUR',
    'de-DE': 'EUR',
    'de-AT': 'EUR',
    'fr': 'EUR',
    'fr-FR': 'EUR',
    'es': 'EUR',
    'es-ES': 'EUR',
    'it': 'EUR',
    'it-IT': 'EUR',
    'ja': 'JPY',
    'ja-JP': 'JPY',
    'zh': 'CNY',
    'zh-CN': 'CNY',
    'hi': 'INR',
    'hi-IN': 'INR'
  };
  
  // Try to get the user's locale from the browser
  const userLocale = navigator.language || 'en-US';
  
  // Return the appropriate currency code or USD as fallback
  return localeCurrencyMap[userLocale] || 'USD';
} 