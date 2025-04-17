import { PackageInfo } from '../components/ui/PackageCard';
import { PackageType } from '../types/questionnaire';

// Default packages data
export const PACKAGES: PackageInfo[] = [
  {
    id: 'single',
    name: 'Single Session',
    description: 'One-time analysis with personalized scalar prescription',
    price: 29,
    features: [
      'One-time health analysis',
      'Single scalar energy prescription',
      'Basic email support'
    ],
    highlight: false
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential healing package for mild to moderate concerns',
    price: 79,
    period: 'monthly',
    features: [
      '30-day program with 3 scalar frequency prescriptions',
      'Weekly adjustment of frequencies',
      'Email support',
      'Access to educational resources'
    ],
    highlight: false
  },
  {
    id: 'enhanced',
    name: 'Enhanced Plan',
    description: 'Comprehensive healing for moderate to significant concerns',
    price: 149,
    period: 'monthly',
    features: [
      '60-day program with 6 scalar frequency prescriptions',
      'Bi-weekly adjustment of frequencies',
      'Email and chat support',
      'Access to all educational resources',
      'One consultation call'
    ],
    highlight: true,
    badge: 'Popular'
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Most extensive healing for complex or severe health concerns',
    price: 249,
    period: 'monthly',
    features: [
      '90-day program with unlimited scalar frequency prescriptions',
      'Weekly adjustment of frequencies',
      'Priority email and chat support',
      'Access to all educational resources',
      'Three consultation calls',
      'Personalized wellness plan'
    ],
    highlight: false
  }
];

// Get package name
export function getPackageName(packageType: PackageType | null): string {
  const packageMap: Record<string, string> = {
    'single': 'Single Session',
    'basic': 'Basic Plan',
    'enhanced': 'Enhanced Plan',
    'premium': 'Premium Plan',
    'none': 'No Package'
  };
  return packageType ? packageMap[packageType] || 'Unknown Package' : 'No Package';
}

// Get package price
export function getPackagePrice(packageType: PackageType | null): number {
  const priceMap: Record<string, number> = {
    'single': 29,
    'basic': 79,
    'enhanced': 149,
    'premium': 249,
    'none': 0
  };
  return packageType ? priceMap[packageType] || 0 : 0;
}

// Get package duration in days
export function getPackageDurationDays(packageType: PackageType | null): number {
  const durationMap: Record<string, number> = {
    'single': 7,
    'basic': 30,
    'enhanced': 60,
    'premium': 90,
    'none': 0
  };
  return packageType ? durationMap[packageType] || 0 : 0;
}

// Get package duration as formatted string
export function getPackageDurationText(packageType: PackageType | null): string {
  const durationMap: Record<string, string> = {
    'single': 'One-time session',
    'basic': '30 days',
    'enhanced': '60 days',
    'premium': '90 days',
    'none': 'No duration'
  };
  return packageType ? durationMap[packageType] || 'Unknown' : 'None';
}

// Get package info by ID
export function getPackageById(packageId: string): PackageInfo | undefined {
  return PACKAGES.find(pkg => pkg.id === packageId);
} 