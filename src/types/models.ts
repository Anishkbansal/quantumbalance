/**
 * Common interfaces used throughout the application
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  packageType: string;
  preferredCurrency?: string;
  activePackageId?: string;
  phone?: string;
  profilePicture?: string;
}

export interface PackageDetails {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  price: number;
  duration?: number;
  durationDays?: number;
  description: string;
  features: string[];
  maxPrescriptions?: number;
  purchaseDate?: string;
  expiryDate?: string;
  healing_data?: any;
}

export interface Prescription {
  _id: string;
  title: string;
  description: string;
  frequency: string;
  duration: string;
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface HealingData {
  isPregnant?: boolean;
  age?: string | number;
  gender?: string;
  height?: string;
  weight?: string;
  // MongoDB data structure
  healthConcerns?: Array<{
    description: string;
    type: string;
    severity: number;
    _id?: string;
  }>;
  painLocations?: string[];
  otherPainLocation?: string;
  emotionalState?: string;
  toxinExposure?: string[];
  lifestyleFactors?: string[];
  healingGoals?: string[];
  // Legacy data structure (for backward compatibility)
  emotionalWellbeing?: Record<string, boolean>;
  environmentalFactors?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} 