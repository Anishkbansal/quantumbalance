import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, ClipboardList, Calendar, Package, RefreshCw } from 'lucide-react';

interface QuestionnaireHistoryItem {
  id: string;
  created_at: string;
  package_type: string;
}

// Mock data for frontend-only display
const MOCK_QUESTIONNAIRE_HISTORY: QuestionnaireHistoryItem[] = [
  {
    id: '1',
    created_at: '2023-09-15T14:30:00Z',
    package_type: 'premium'
  },
  {
    id: '2',
    created_at: '2023-08-20T10:15:00Z',
    package_type: 'enhanced'
  },
  {
    id: '3',
    created_at: '2023-07-05T09:45:00Z',
    package_type: 'basic'
  }
];

const QuestionnaireHistory = () => {
  const navigate = useNavigate();
  // Mock user data for frontend-only display
  const user = { package_type: 'premium' };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaireHistory, setQuestionnaireHistory] = useState<QuestionnaireHistoryItem[]>([]);

  useEffect(() => {
    // Simulate loading with mock data
    const timer = setTimeout(() => {
      setQuestionnaireHistory(MOCK_QUESTIONNAIRE_HISTORY);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateQuestionnaire = () => {
    navigate('/health-questionnaire', { state: { isUpdate: true } });
  };

  const handleViewQuestionnaire = (id: string) => {
    navigate(`/questionnaire-details/${id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          <Loader className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-navy-300">Retrieving your questionnaire history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gold-500 mb-6">Health Questionnaire History</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-8 bg-navy-800 p-6 rounded-lg border border-navy-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Your Health Profile</h2>
            <button
              onClick={handleUpdateQuestionnaire}
              className="py-2 px-4 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Questionnaire
            </button>
          </div>
          
          <p className="text-navy-300 mb-6">
            Your health questionnaire helps us customize your healing frequency prescriptions. 
            Update it anytime your health condition changes to receive the most effective treatment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
              <div className="flex items-center text-gold-500 mb-2">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-semibold">Current Package</span>
              </div>
              <p className="text-white">{getPackageName(user?.package_type || 'none')}</p>
            </div>
            
            <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
              <div className="flex items-center text-gold-500 mb-2">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-semibold">Last Updated</span>
              </div>
              <p className="text-white">
                {questionnaireHistory.length > 0 
                  ? formatDate(questionnaireHistory[0].created_at)
                  : 'No questionnaire submitted yet'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
          <h2 className="text-xl font-semibold text-white mb-4">Questionnaire History</h2>
          
          {questionnaireHistory.length === 0 ? (
            <div className="p-4 bg-navy-750 rounded-lg border border-navy-600 text-center">
              <p className="text-navy-300">You haven't submitted any health questionnaires yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionnaireHistory.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-navy-750 rounded-lg border border-navy-600 hover:border-gold-500 transition-colors cursor-pointer"
                  onClick={() => handleViewQuestionnaire(item.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ClipboardList className="w-5 h-5 text-gold-500 mr-3" />
                      <div>
                        <p className="text-white font-medium">Health Questionnaire</p>
                        <p className="text-navy-400 text-sm">
                          {formatDate(item.created_at)} • {getPackageName(item.package_type)}
                        </p>
                      </div>
                    </div>
                    <span className="text-gold-500 text-sm">View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireHistory; 