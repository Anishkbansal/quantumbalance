import React from 'react';
import { PackageType } from '../../types/questionnaire';
import { AlertCircle } from 'lucide-react';
import PackageCard from '../ui/PackageCard';
import { PACKAGES } from '../../utils/packageData';

interface PackageSelectionProps {
  selectedPackage: PackageType | null;
  onPackageSelect: (packageType: PackageType) => void;
  onProceed: () => void;
  loading: boolean;
  error?: string | null;
  onGoBack?: () => void;
}

const PackageSelection: React.FC<PackageSelectionProps> = ({
  selectedPackage,
  onPackageSelect,
  onProceed,
  loading,
  error,
  onGoBack
}) => {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Healing Package</h2>
        <p className="text-gray-300">Choose the best package for your healing journey</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            packageInfo={pkg}
            isSelected={selectedPackage === pkg.id}
            onSelect={() => onPackageSelect(pkg.id as PackageType)}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onGoBack}
          disabled={loading}
          className="px-6 py-2 bg-navy-700 hover:bg-navy-600 transition-colors rounded-md text-gray-200"
        >
          Back
        </button>
        
        <button
          type="button"
          onClick={onProceed}
          disabled={!selectedPackage || loading}
          className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 transition-colors rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default PackageSelection; 