import React from 'react';
import { useNavigate } from 'react-router-dom';

const WellnessLogs = () => {
  const navigate = useNavigate();
  
  // Mock data (in real app, this would come from API)
  const logs = [
    { id: 1, date: '2023-04-15', mood: 'Good', sleep: '7 hours', notes: 'Felt energetic today' },
    { id: 2, date: '2023-04-14', mood: 'Fair', sleep: '6 hours', notes: 'Slight headache in the morning' },
    { id: 3, date: '2023-04-13', mood: 'Excellent', sleep: '8 hours', notes: 'Productive day, exercised in the morning' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Wellness Logs</h1>
        <button 
          onClick={() => alert('Add log feature coming soon')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add New Log
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Quick Log</h2>
        <div className="border rounded p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How are you feeling today?
            </label>
            <select className="w-full border rounded p-2">
              <option value="">Select mood</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours of sleep
            </label>
            <input 
              type="number" 
              min="0" 
              max="24" 
              className="w-full border rounded p-2"
              placeholder="Enter hours of sleep"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea 
              className="w-full border rounded p-2" 
              rows={3}
              placeholder="Enter any notes about your day"
            ></textarea>
          </div>
          
          <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Save Log
          </button>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mb-3">Recent Logs</h2>
      {logs.length > 0 ? (
        <div className="grid gap-4">
          {logs.map(log => (
            <div key={log.id} className="border rounded p-4">
              <div className="flex justify-between">
                <h3 className="font-semibold">{log.date}</h3>
                <span className="text-gray-500">Mood: {log.mood}</span>
              </div>
              <p className="text-gray-700 mt-2">Sleep: {log.sleep}</p>
              <p className="text-gray-600 mt-1">{log.notes}</p>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-gold-100 text-gold-700 rounded hover:bg-gold-200">
                  Edit
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded">
          <p className="text-gray-500">No logs found</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-100 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default WellnessLogs; 