import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, ArrowLeft, Calendar, Package, RefreshCw } from 'lucide-react';

interface HealthConcern {
  description: string;
  type: 'acute' | 'chronic';
  severity: 1 | 2 | 3 | 4;
}

interface Questionnaire {
  _id: string;
  isPregnant: boolean;
  healthConcerns: HealthConcern[];
  painLocations: string[];
  otherPainLocation?: string;
  emotionalState: string;
  toxinExposure: string[];
  lifestyleFactors: string[];
  healingGoals: string[];
  package_type: string;
  created_at: string;
}

// Mock data for frontend-only demo
const MOCK_QUESTIONNAIRE: Questionnaire = {
  _id: '1',
  isPregnant: false,
  healthConcerns: [
    { description: 'Chronic fatigue', type: 'chronic', severity: 3 },
    { description: 'Migraine headaches', type: 'acute', severity: 4 },
    { description: 'Lower back pain', type: 'chronic', severity: 2 }
  ],
  painLocations: ['head', 'neck', 'lower_back'],
  emotionalState: 'stressed',
  toxinExposure: ['chemicals', 'emf'],
  lifestyleFactors: ['sedentary', 'poor_sleep'],
  healingGoals: ['reduce_pain', 'improve_energy', 'better_sleep'],
  package_type: 'premium',
  created_at: '2023-08-15T14:30:00Z'
};

const QuestionnaireDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);

  useEffect(() => {
    // For frontend-only demo, simulate loading data
    const timer = setTimeout(() => {
      setQuestionnaire(MOCK_QUESTIONNAIRE);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  const handleUpdateQuestionnaire = () => {
    navigate('/health-questionnaire', { state: { isUpdate: true } });
  };

  const goBack = () => {
    navigate('/questionnaire-history');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case 'single':
        return 'Single Session';
      case 'basic':
        return 'Basic Plan';
      case 'enhanced':
        return 'Enhanced Plan';
      case 'premium':
        return 'Premium Plan';
      default:
        return 'No Package';
    }
  };

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Significant';
      case 4:
        return 'Severe';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          <Loader className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-navy-300">Retrieving your questionnaire details.</p>
        </div>
      </div>
    );
  }

  if (!questionnaire && !loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Questionnaire Not Found</h2>
          <p className="text-navy-300 mb-6">The questionnaire you're looking for doesn't exist or you don't have permission to view it.</p>
          <button 
            onClick={goBack}
            className="py-2 px-4 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button 
            onClick={goBack}
            className="flex items-center text-navy-300 hover:text-white mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gold-500">Questionnaire Details</h1>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-8 bg-navy-800 p-6 rounded-lg border border-navy-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Questionnaire Information</h2>
            <button
              onClick={handleUpdateQuestionnaire}
              className="py-2 px-4 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Questionnaire
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
              <div className="flex items-center text-gold-500 mb-2">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-semibold">Submitted</span>
              </div>
              <p className="text-white">
                {formatDate(questionnaire?.created_at || '')}
              </p>
            </div>
            
            <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
              <div className="flex items-center text-gold-500 mb-2">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-semibold">Package Type</span>
              </div>
              <p className="text-white">{getPackageName(questionnaire?.package_type || 'none')}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <h3 className="text-xl font-semibold text-white mb-4">Health Concerns</h3>
            {questionnaire?.healthConcerns && questionnaire.healthConcerns.length > 0 ? (
              <div className="space-y-4">
                {questionnaire.healthConcerns.map((concern, index) => (
                  <div key={index} className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                    <h4 className="text-lg font-medium text-gold-500 mb-2">{concern.description}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-navy-400 text-sm">Type:</span>
                        <p className="text-white capitalize">{concern.type}</p>
                      </div>
                      <div>
                        <span className="text-navy-400 text-sm">Severity:</span>
                        <p className="text-white">{getSeverityText(concern.severity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-navy-300">No health concerns reported.</p>
            )}
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <h3 className="text-xl font-semibold text-white mb-4">Pain Locations</h3>
            {questionnaire?.painLocations && questionnaire.painLocations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {questionnaire.painLocations.map((location, index) => (
                  <span key={index} className="px-3 py-1 bg-navy-700 text-navy-300 rounded-full">
                    {location.replace('_', ' ')}
                  </span>
                ))}
                {questionnaire.otherPainLocation && (
                  <span className="px-3 py-1 bg-navy-700 text-navy-300 rounded-full">
                    {questionnaire.otherPainLocation}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-navy-300">No pain locations reported.</p>
            )}
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <h3 className="text-xl font-semibold text-white mb-4">Emotional State</h3>
            <p className="text-white capitalize">{questionnaire?.emotionalState || 'Not specified'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
              <h3 className="text-xl font-semibold text-white mb-4">Toxin Exposure</h3>
              {questionnaire?.toxinExposure && questionnaire.toxinExposure.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {questionnaire.toxinExposure.map((exposure, index) => (
                    <span key={index} className="px-3 py-1 bg-navy-700 text-navy-300 rounded-full">
                      {exposure.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-navy-300">No toxin exposure reported.</p>
              )}
            </div>
            
            <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
              <h3 className="text-xl font-semibold text-white mb-4">Lifestyle Factors</h3>
              {questionnaire?.lifestyleFactors && questionnaire.lifestyleFactors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {questionnaire.lifestyleFactors.map((factor, index) => (
                    <span key={index} className="px-3 py-1 bg-navy-700 text-navy-300 rounded-full">
                      {factor.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-navy-300">No lifestyle factors reported.</p>
              )}
            </div>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <h3 className="text-xl font-semibold text-white mb-4">Healing Goals</h3>
            {questionnaire?.healingGoals && questionnaire.healingGoals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {questionnaire.healingGoals.map((goal, index) => (
                  <span key={index} className="px-3 py-1 bg-gold-500/20 text-gold-500 rounded-full">
                    {goal.replace('_', ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-navy-300">No healing goals specified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireDetails; 