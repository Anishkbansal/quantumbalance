import React from 'react';
import { useNavigate } from 'react-router-dom';

const Prescriptions = () => {
  const navigate = useNavigate();
  
  // Mock data (in real app, this would come from API)
  const prescriptions = [
    { id: 1, name: 'Vitamin D Supplement', dosage: '1000 IU', frequency: 'Daily', notes: 'Take with food' },
    { id: 2, name: 'Magnesium', dosage: '300mg', frequency: 'Daily', notes: 'Take before bed' },
    { id: 3, name: 'Omega-3', dosage: '1000mg', frequency: 'Twice daily', notes: 'Take with meals' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <button 
          onClick={() => alert('Add prescription feature coming soon')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add New
        </button>
      </div>
      
      {prescriptions.length > 0 ? (
        <div className="grid gap-4">
          {prescriptions.map(prescription => (
            <div key={prescription.id} className="border rounded p-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">{prescription.name}</h2>
                <span className="text-gray-500">{prescription.dosage}</span>
              </div>
              <p className="text-gray-700 mt-2">Frequency: {prescription.frequency}</p>
              <p className="text-gray-600 mt-1">{prescription.notes}</p>
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
          <p className="text-gray-500">No prescriptions found</p>
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

export default Prescriptions; 