import React from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../utils/formatters';

export interface PackageInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  period?: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

interface PackageCardProps {
  packageInfo: PackageInfo;
  isSelected: boolean;
  onSelect: () => void;
  isUserActivePackage?: boolean;
  userHasActivePackage?: boolean;
  isPackageRenewable?: boolean;
  onRenew?: () => void;
  isLoading?: boolean;
  isRenewalLoading?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({
  packageInfo,
  isSelected,
  onSelect,
  isUserActivePackage = false,
  userHasActivePackage = false,
  isPackageRenewable = false,
  onRenew,
  isLoading = false,
  isRenewalLoading = false,
}) => {
  const { id, name, description, price, period, features, highlight, badge } = packageInfo;
  const { currency } = useCurrency();
  
  // Format the price using the user's preferred currency
  const formattedPrice = formatCurrency(price, currency.code);
  
  // If this is the user's current package, automatically set it as highlighted
  const isHighlighted = highlight || isUserActivePackage;
  
  // Determine if renewal is available - only for current package when it's renewable
  const showRenewalOption = isUserActivePackage && isPackageRenewable;
  
  // If not user's active package but user has an active package,
  // they can only select it if their current package is renewable
  const canSelectDifferentPackage = !isUserActivePackage && userHasActivePackage && isPackageRenewable;
  
  // Determine if button should be disabled
  const isButtonDisabled = (userHasActivePackage && !isUserActivePackage && !isPackageRenewable);
  
  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden 
        ${isHighlighted 
          ? 'border-2 border-gold-500 shadow-lg shadow-gold-500/20' 
          : 'border border-navy-600'
        }
        ${isSelected ? 'bg-navy-700' : 'bg-navy-800'}
        transition-all duration-200 hover:transform hover:scale-[1.02]`}
    >
      {badge && (
        <div className="absolute top-0 right-0 bg-gold-500 text-navy-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
          {badge}
        </div>
      )}
      
      {isUserActivePackage && (
        <div className="absolute top-0 left-0 bg-green-500 text-navy-900 text-xs font-bold px-3 py-1 rounded-br-lg">
          Current Package
        </div>
      )}
      
      {isPackageRenewable && !isUserActivePackage && (
        <div className="absolute top-0 left-0 bg-amber-500 text-navy-900 text-xs font-bold px-3 py-1 rounded-br-lg">
          Available for Switch
        </div>
      )}
      
      <div className="p-6 flex-1">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-white">{formattedPrice}</span>
          {period && <span className="text-gray-400 ml-1">/{period}</span>}
        </div>
        <p className="text-gray-300 mb-4">{description}</p>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-5 h-5 text-gold-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 bg-navy-900">
        {showRenewalOption ? (
          <button
            type="button"
            onClick={onRenew}
            className="w-full py-2 rounded-md bg-amber-600 text-white hover:bg-amber-500 transition-colors"
          >
            <span className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Renew Package
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={canSelectDifferentPackage ? onRenew : onSelect}
            disabled={isButtonDisabled}
            className={`w-full py-2 rounded-md transition-colors ${
              isSelected
                ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900'
                : isUserActivePackage
                  ? 'bg-green-600 text-white'
                  : canSelectDifferentPackage
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            } ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUserActivePackage ? (
              'Current Package'
            ) : canSelectDifferentPackage ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch to This
              </span>
            ) : isSelected ? (
              <span className="flex items-center justify-center">
                <Check className="w-4 h-4 mr-2" />
                Selected
              </span>
            ) : (
              'Select'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PackageCard; 