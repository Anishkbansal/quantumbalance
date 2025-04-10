import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <div className="text-gold-500 text-9xl font-bold mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-navy-300 text-lg mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition"
        >
          <Home size={20} />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound; 