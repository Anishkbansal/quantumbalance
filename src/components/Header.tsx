import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Users } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // For frontend demo only
  const isAdmin = true; // Always show admin features in demo

  return (
    <header className="bg-navy-800 border-b border-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src="/logo.png" alt="Quantum Balance" />
                <span className="ml-2 text-white font-bold text-lg">Quantum Balance</span>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
              >
                Home
              </Link>
              <Link
                to="/packages"
                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/packages' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
              >
                Packages
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith('/admin') ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
                >
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Admin
                  </span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/questionnaire-history" 
              className="flex items-center gap-2 px-4 py-2 text-navy-300 hover:text-white hover:bg-navy-750"
              onClick={() => setIsMenuOpen(false)}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Health History</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 