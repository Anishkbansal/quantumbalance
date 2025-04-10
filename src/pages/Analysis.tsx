import React from 'react';
import { useNavigate } from 'react-router-dom';

const Analysis = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Health Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Wellness Score</h2>
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              78
            </div>
            <div className="ml-4">
              <p className="text-gray-600">Your overall wellness score</p>
              <p className="text-sm text-gray-500">Based on questionnaire and logs</p>
            </div>
          </div>
          <p className="text-gray-700">
            Your wellness score is above average. Continue with your current habits for optimal health.
          </p>
        </div>
        
        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Area Breakdown</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Physical Health</span>
                <span className="text-sm text-gray-600">82%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-500 rounded" style={{ width: '82%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Mental Wellbeing</span>
                <span className="text-sm text-gray-600">74%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-gold-500 rounded" style={{ width: '74%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Nutrition</span>
                <span className="text-sm text-gray-600">68%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-yellow-500 rounded" style={{ width: '68%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Sleep Quality</span>
                <span className="text-sm text-gray-600">85%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-purple-500 rounded" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border rounded p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <ul className="space-y-3 list-disc pl-5">
          <li>Consider increasing your water intake to 8 glasses per day</li>
          <li>Try meditation for 10 minutes daily to improve mental wellbeing</li>
          <li>Include more leafy greens in your diet for better nutrition</li>
          <li>Maintain your current sleep schedule</li>
        </ul>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => navigate('/health-questionnaire')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Update Questionnaire
        </button>
      </div>
    </div>
  );
};

export default Analysis; 