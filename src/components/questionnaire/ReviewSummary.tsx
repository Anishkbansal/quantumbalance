import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { QuestionnaireData, PackageType } from '../../types/questionnaire';
import { getPackageName, getPackagePrice, getPackageDurationText } from '../../utils/packageData';

interface ReviewSummaryProps {
  formData: QuestionnaireData;
  packageType: PackageType | null;
  onEdit: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
  isRenewal?: boolean;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  formData,
  packageType,
  onEdit,
  onConfirm,
  loading,
  error,
  isRenewal = false
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
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Information</h2>
        <p className="text-gray-300">Please review your questionnaire answers and package selection</p>
      </div>
      
      <div className="space-y-8">
        {/* Package Summary */}
        <div className="bg-navy-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-navy-600 pb-2">Selected Package</h3>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold text-white">{getPackageName(packageType)}</h4>
              <p className="text-gray-300">{getPackageDurationText(packageType)}</p>
            </div>
            <span className="text-2xl font-bold text-white">${getPackagePrice(packageType)}</span>
          </div>
        </div>
        
        {/* Health Information Summary */}
        <div className="bg-navy-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-navy-600 pb-2">Health Information</h3>
          
          {/* Pregnancy Status */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Pregnancy Status</h4>
            <p className="text-white">
              {formData.isPregnant ? 'Currently pregnant' : 'Not pregnant'}
            </p>
          </div>
          
          {/* Health Concerns */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Health Concerns</h4>
            {formData.healthConcerns.some(c => c.description) ? (
              <ul className="list-disc list-inside text-white">
                {formData.healthConcerns
                  .filter(concern => concern.description)
                  .map((concern, index) => (
                    <li key={index} className="my-1">
                      {concern.description} - 
                      <span className="text-gray-300">
                        {concern.type === 'acute' ? ' Recent' : ' Long-term'}, 
                        Severity: {concern.severity}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No health concerns specified</p>
            )}
          </div>
          
          {/* Pain Locations */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Pain Locations</h4>
            {formData.painLocations && formData.painLocations.length > 0 ? (
              <div>
                <p className="text-white">{formData.painLocations.join(', ')}</p>
                {formData.otherPainLocation && (
                  <p className="text-white">Other: {formData.otherPainLocation}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">No pain locations specified</p>
            )}
          </div>
          
          {/* Emotional State */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Emotional State</h4>
            <p className="text-white">{formData.emotionalState || 'Not specified'}</p>
          </div>
          
          {/* Environmental Factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Environmental Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.toxinExposure && formData.toxinExposure.length > 0 ? (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500">Toxin Exposure</h5>
                  <p className="text-white">{formData.toxinExposure.join(', ')}</p>
                </div>
              ) : (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500">Toxin Exposure</h5>
                  <p className="text-gray-400 italic">None specified</p>
                </div>
              )}
              
              {formData.lifestyleFactors && formData.lifestyleFactors.length > 0 ? (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500">Lifestyle Factors</h5>
                  <p className="text-white">{formData.lifestyleFactors.join(', ')}</p>
                </div>
              ) : (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500">Lifestyle Factors</h5>
                  <p className="text-gray-400 italic">None specified</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Healing Goals */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400">Healing Goals</h4>
            {formData.healingGoals && formData.healingGoals.length > 0 ? (
              <ul className="list-disc list-inside text-white">
                {formData.healingGoals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No healing goals specified</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onEdit}
          disabled={loading}
          className="px-6 py-2 bg-navy-700 hover:bg-navy-600 transition-colors rounded-md text-gray-200"
        >
          Back
        </button>
        
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 transition-colors rounded-md text-white font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirm & Complete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewSummary; 