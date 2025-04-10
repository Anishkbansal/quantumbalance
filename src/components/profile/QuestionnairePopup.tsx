import React from 'react';
import { X } from 'lucide-react';
import { HealingData } from '../../types/models';
import { 
  formatKey, 
  getBasicInfo, 
  hasHealthConcerns, 
  getHealthConcerns,
  hasPainLocations,
  getPainLocations,
  hasEmotionalWellbeing,
  getEmotionalWellbeing,
  hasEnvironmentalFactors,
  getEnvironmentalFactors,
  hasHealingGoals,
  getHealingGoals 
} from '../../utils/formatters';

interface QuestionnairePopupProps {
  healingData: HealingData;
  onClose: () => void;
}

export default function QuestionnairePopup({ healingData, onClose }: QuestionnairePopupProps) {
  if (!healingData) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-navy-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-navy-800 p-4 border-b border-navy-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gold-500">Health Questionnaire</h2>
          <button 
            onClick={onClose} 
            className="text-navy-300 hover:text-white p-1 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600 space-y-2">
              {Object.entries(getBasicInfo(healingData)).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-navy-300">{formatKey(key)}:</span>
                  <span className="text-white font-medium">{String(value || 'N/A')}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Health Concerns */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Health Concerns</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600">
              {hasHealthConcerns(healingData) ? (
                <ul className="list-disc list-inside space-y-1 text-white">
                  {Object.values(getHealthConcerns(healingData)).map((concern, index) => (
                    <li key={index} className="text-white">
                      {concern}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-navy-300">No specific health concerns reported</p>
              )}
            </div>
          </div>
          
          {/* Pain Locations */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Pain Locations</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600">
              {hasPainLocations(healingData) ? (
                <ul className="list-disc list-inside space-y-1 text-white">
                  {Object.values(getPainLocations(healingData)).map((location, index) => (
                    <li key={index} className="text-white">
                      {location}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-navy-300">No pain locations reported</p>
              )}
            </div>
          </div>
          
          {/* Emotional Wellbeing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Emotional Wellbeing</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600">
              {hasEmotionalWellbeing(healingData) ? (
                <div className="text-white">
                  <p className="mb-2">Current emotional state:</p>
                  <p className="font-medium text-gold-500">{healingData.emotionalState || 'Not specified'}</p>
                </div>
              ) : (
                <p className="text-navy-300">No emotional wellbeing concerns reported</p>
              )}
            </div>
          </div>
          
          {/* Environmental Factors */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Environmental Factors</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600">
              {hasEnvironmentalFactors(healingData) ? (
                <div className="space-y-4">
                  {healingData.toxinExposure && healingData.toxinExposure.length > 0 && (
                    <div>
                      <p className="text-navy-300 mb-2">Toxin Exposure:</p>
                      <ul className="list-disc list-inside space-y-1 text-white pl-2">
                        {healingData.toxinExposure.map((toxin: string, index: number) => (
                          <li key={index}>{toxin}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {healingData.lifestyleFactors && healingData.lifestyleFactors.length > 0 && (
                    <div>
                      <p className="text-navy-300 mb-2">Lifestyle Factors:</p>
                      <ul className="list-disc list-inside space-y-1 text-white pl-2">
                        {healingData.lifestyleFactors.map((factor: string, index: number) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-navy-300">No environmental factors reported</p>
              )}
            </div>
          </div>
          
          {/* Healing Goals */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Healing Goals</h3>
            <div className="bg-navy-700 p-4 rounded-md border border-navy-600">
              {hasHealingGoals(healingData) ? (
                <ul className="list-disc list-inside space-y-1 text-white">
                  {healingData.healingGoals && healingData.healingGoals.map((goal: string, index: number) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-navy-300">No healing goals specified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 