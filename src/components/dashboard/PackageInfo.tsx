import React from 'react';
import { Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PackageTimeInfo {
  days: number;
  hours: number;
  formattedDate: string;
}

interface PackageInfo {
  _id: string;
  name: string;
  description: string;
  packageType: string;
  price: number;
  features: string[];
  expiryDate: string;
}

interface PackageInfoCardProps {
  activePackage: PackageInfo | null;
  packageTimeRemaining: PackageTimeInfo | null;
  loading: boolean;
}

const PackageInfoCard: React.FC<PackageInfoCardProps> = ({
  activePackage,
  packageTimeRemaining,
  loading
}) => {
  const navigate = useNavigate();

  const handleGetPackage = () => {
    navigate('/packages');
  };

  if (loading) {
    return (
      <div className="bg-navy-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-1/2 bg-navy-700 rounded mb-4"></div>
        <div className="h-4 w-3/4 bg-navy-700 rounded mb-3"></div>
        <div className="h-4 w-1/2 bg-navy-700 rounded"></div>
      </div>
    );
  }

  if (!activePackage) {
    return (
      <div className="bg-navy-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">No Active Package</h3>
        <p className="text-gray-400 mb-4">
          You don't have an active healing package yet. Get started with one to receive personalized frequencies.
        </p>
        <button
          onClick={handleGetPackage}
          className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-md font-medium"
        >
          View Available Packages
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2 md:mb-0">{activePackage.name}</h3>
        
        {packageTimeRemaining && (
          <div className="flex items-center space-x-1 text-amber-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {packageTimeRemaining.days > 0 ? `${packageTimeRemaining.days} days remaining` : `${packageTimeRemaining.hours} hours remaining`}
            </span>
          </div>
        )}
      </div>
      
      <p className="text-gray-400 mb-4">{activePackage.description}</p>
      
      <div className="flex items-center text-gray-300 mb-2">
        <Activity className="w-4 h-4 mr-2 text-gold-500" />
        <span>Package expires on {packageTimeRemaining?.formattedDate}</span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-navy-700">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Package Features:</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {activePackage.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gold-500 mr-2">•</span>
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PackageInfoCard; 