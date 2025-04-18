import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Users, Menu, X, Gift, Package } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // For frontend demo only
  const isAdmin = true; // Always show admin features in demo

  return (
    <header className="bg-navy-800 border-b border-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img className="h-6 sm:h-8 w-auto" src="/logo.png" alt="Quantum Balance" />
                <span className="ml-2 text-white font-bold text-base sm:text-lg truncate max-w-[120px] sm:max-w-full">Quantum Balance</span>
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
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Packages
                </span>
              </Link>
              <Link
                to="/gift-cards"
                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/gift-cards' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
              >
                <span className="flex items-center">
                  <Gift className="h-4 w-4 mr-1" />
                  Gift Cards
                </span>
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

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-navy-300 hover:text-white hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-800 focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/questionnaire-history" 
              className="flex items-center gap-2 px-4 py-2 text-navy-300 hover:text-white hover:bg-navy-750 text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Health History</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-navy-750 border-b border-navy-700`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
          >
            Home
          </Link>
          <Link
            to="/packages"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname === '/packages' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
          >
            <span className="flex items-center">
              <Package className="h-4 w-4 mr-1" />
              Packages
            </span>
          </Link>
          <Link
            to="/gift-cards"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname === '/gift-cards' ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
          >
            <span className="flex items-center">
              <Gift className="h-4 w-4 mr-1" />
              Gift Cards
            </span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin/users"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith('/admin') ? 'text-white bg-navy-700' : 'text-navy-300 hover:text-white hover:bg-navy-750'}`}
            >
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Admin
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 