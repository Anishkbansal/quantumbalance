import React from 'react';
import { PackageDetails } from '../../types/models';
import { formatDate } from '../../utils/formatters';
import { CardContent } from '../ui/Card';
import { Button } from '../ui/FormElements';

interface PackageInfoProps {
  packageInfo: PackageDetails;
  onViewQuestionnaire: () => void;
}

export function ActivePackageInfo({ packageInfo, onViewQuestionnaire }: PackageInfoProps) {
  return (
    <CardContent>
      <div className="flex justify-between items-center mb-3">
        <span className="text-navy-300">Current Package:</span>
        <span className="font-medium text-gold-500 capitalize">{packageInfo?.name || 'Standard Package'}</span>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-navy-300">Package Type:</span>
        <span className="font-medium text-gold-500 capitalize">{packageInfo?.type || 'standard'}</span>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-navy-300">Purchase Date:</span>
        <span className="text-white">{packageInfo?.purchaseDate ? formatDate(packageInfo.purchaseDate) : 'N/A'}</span>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-navy-300">Expiry Date:</span>
        <span className="text-white">{packageInfo?.expiryDate ? formatDate(packageInfo.expiryDate) : 'N/A'}</span>
      </div>
      
      {packageInfo?.expiryDate && (
        <div className="mb-4">
          <div className="w-full bg-navy-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-gold-600 to-gold-400 h-full rounded-full"
              style={{ 
                width: calculateRemainingPercentage(packageInfo.purchaseDate, packageInfo.expiryDate)
              }}
            ></div>
          </div>
          <div className="mt-1 text-right">
            <span className="text-navy-300 text-xs">
              {getDaysRemaining(packageInfo.expiryDate)} days remaining
            </span>
          </div>
        </div>
      )}
      
      {packageInfo?.healing_data && (
        <div className="mt-4">
          <Button
            onClick={onViewQuestionnaire}
            variant="secondary"
            className="w-full"
          >
            View Health Questionnaire
          </Button>
        </div>
      )}
    </CardContent>
  );
}

function calculateRemainingPercentage(purchaseDate: string | undefined, expiryDate: string | undefined): string {
  if (!purchaseDate || !expiryDate) return '0%';
  
  const start = new Date(purchaseDate).getTime();
  const end = new Date(expiryDate).getTime();
  const current = new Date().getTime();
  
  const totalDuration = end - start;
  const elapsed = current - start;
  
  const percentageComplete = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const percentageRemaining = 100 - percentageComplete;
  
  return `${percentageRemaining}%`;
}

function getDaysRemaining(expiryDate: string | undefined): number {
  if (!expiryDate) return 0;
  
  const end = new Date(expiryDate).getTime();
  const current = new Date().getTime();
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.ceil((end - current) / msPerDay));
  
  return daysRemaining;
}

export function NoPackageInfo() {
  return (
    <CardContent>
      <p className="text-white mb-3">You don't have any active package.</p>
      <a href="/packages" className="inline-block px-4 py-2 bg-gold-500 text-navy-900 hover:bg-gold-400 rounded-md transition-colors">
        View Available Packages
      </a>
    </CardContent>
  );
}

export function HealthDataInfo({ healingData }: { healingData: any }) {
  const basicInfo = {
    isPregnant: healingData.isPregnant ? 'Yes' : 'No',
    age: healingData.age || 'Not specified',
    gender: healingData.gender || 'Not specified',
    height: healingData.height || 'Not specified',
    weight: healingData.weight || 'Not specified',
  };
  
  return (
    <CardContent>
      {Object.entries(basicInfo).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center mb-2 last:mb-0">
          <span className="text-navy-300">
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .replace(/_/g, ' ')}:
          </span>
          <span className="text-white">{String(value)}</span>
        </div>
      ))}
    </CardContent>
  );
} 