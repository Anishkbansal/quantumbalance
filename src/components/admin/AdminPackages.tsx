import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, Check, Plus, Trash } from 'lucide-react';

interface Package {
  _id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features: string[];
  durationDays: number;
  maxPrescriptions: number;
  active: boolean;
}

const AdminPackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [seedingPackages, setSeedingPackages] = useState(false);
  
  useEffect(() => {
    fetchPackages();
  }, []);
  
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/packages/all', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setPackages(response.data.data);
      } else {
        setError('Failed to load packages: ' + response.data.message);
      }
    } catch (err: any) {
      setError('Error loading packages: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const seedDefaultPackages = async () => {
    try {
      setSeedingPackages(true);
      setError(null);
      setSuccess(null);
      
      // Define default packages
      const defaultPackages = [
        {
          name: 'Single Session',
          type: 'single',
          price: 15,
          description: 'Perfect for trying out our service with a single healing session.',
          features: [
            'Two Sonic Prescriptions',
            '3-day access',
            'Basic Support'
          ],
          durationDays: 3,
          maxPrescriptions: 2
        },
        {
          name: 'Basic Plan',
          type: 'basic',
          price: 25,
          description: 'Foundational healing with key sonic prescriptions for common needs.',
          features: [
            'Sleep, Detox, Immunity Sonic Prescriptions',
            '+1 Add-on Sonic Prescription',
            '15-Day Access',
            'Basic Support'
          ],
          durationDays: 15,
          maxPrescriptions: 4
        },
        {
          name: 'Enhanced Plan',
          type: 'enhanced',
          price: 45,
          description: 'Comprehensive healing approach with expanded prescription options.',
          features: [
            'Sleep, Detox, Immunity',
            '+3 Add-on Prescriptions',
            '30-Day Access',
            'Basic Support'
          ],
          durationDays: 30,
          maxPrescriptions: 7
        },
        {
          name: 'Premium Plan',
          type: 'premium',
          price: 75,
          description: 'Our most comprehensive offering with full access to all healing technologies.',
          features: [
            'Complete Sonic Prescriptions Library',
            '30-Day Access',
            'Priority Support',
            'Custom Healing Programs'
          ],
          durationDays: 30,
          maxPrescriptions: 0
        }
      ];
      
      // Create each package
      for (const pkg of defaultPackages) {
        await axios.post(
          'http://localhost:5000/api/packages/create',
          pkg,
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      setSuccess('Default packages seeded successfully!');
      fetchPackages(); // Refresh packages list
    } catch (err: any) {
      setError('Error seeding packages: ' + (err.response?.data?.message || err.message));
      console.error('Error seeding packages:', err);
    } finally {
      setSeedingPackages(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <div className="bg-navy-900 p-6 rounded-lg border border-navy-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Packages Management</h2>
        <button
          onClick={seedDefaultPackages}
          disabled={seedingPackages}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
        >
          {seedingPackages ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Seed Default Packages
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 flex items-start">
          <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-8 text-navy-300">
          <p className="mb-4">No packages found</p>
          <p>Click "Seed Default Packages" to add the default package options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-navy-800 border border-navy-700 rounded-lg p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gold-500">{pkg.name}</h3>
                <span className="text-lg font-semibold text-white">{formatCurrency(pkg.price)}</span>
              </div>
              
              <p className="text-navy-300 mb-3">{pkg.description}</p>
              
              <div className="mb-3">
                <p className="text-sm text-navy-400 mb-1">Duration: {pkg.durationDays} days</p>
                <p className="text-sm text-navy-400">
                  Prescriptions: {pkg.maxPrescriptions === 0 ? 'Unlimited' : pkg.maxPrescriptions}
                </p>
              </div>
              
              <div className="border-t border-navy-700 my-3 pt-3">
                <p className="text-sm font-medium text-navy-200 mb-2">Features:</p>
                <ul className="text-sm text-navy-300 space-y-1">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-3 h-3 text-gold-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPackages; 