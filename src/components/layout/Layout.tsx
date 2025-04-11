import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CreditCard, Stethoscope, LogOut, AudioWaveform as Waveform, Info, FlaskRound as Flask, Package, Menu, X, LogIn, Zap, User, AlertCircle, MessageSquare } from 'lucide-react';
import VerifyEmailButton from './VerifyEmailButton';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';

// Define interfaces for navigation and SidebarContent
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  publicOnly?: boolean;
}

interface SidebarContentProps {
  navigation: NavigationItem[];
  location: {
    pathname: string;
  };
  signOut: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const Layout = () => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = !!user?.isAdmin;
  
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Define navigation items based on user type
  const navigation: NavigationItem[] = isAdmin ? [
    // Admin navigation items
    { name: 'Home', href: '/', icon: Waveform, publicOnly: true },
    { name: 'User Management', href: '/admin', icon: Users },
    { name: 'Create User', href: '/admin/create-user', icon: User },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Prescriptions', href: '/admin/prescriptions', icon: Stethoscope },
    { name: 'Profile', href: '/profile', icon: User },
  ] : [
    // Regular user navigation items
    { name: 'Home', href: '/', icon: Waveform, publicOnly: true },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Scientific Evidence', href: '/scientific-evidence', icon: Flask },
    { name: 'Scalar Healing', href: '/scalar-healing', icon: Zap },
    { name: 'Packages', href: '/packages', icon: Package },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmSignOut = async () => {
    try {
      await logout();
    setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  const cancelSignOut = () => {
    setShowLogoutConfirm(false);
  };

  // Filter navigation items based on user role
  const getFilteredNavigation = () => {
    return navigation.filter(item => {
      // If user is logged in, don't show items marked as publicOnly
      if (isAuthenticated && item.publicOnly) {
        return false;
      }
      
      // If user is not admin, don't show admin-only items
      if (!isAdmin && item.adminOnly) {
        return false;
      }
      
      return true;
    });
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-navy-800 p-6 rounded-lg max-w-md w-full mx-4 border border-navy-700">
            <div className="flex items-center mb-4 text-gold-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <h3 className="text-xl font-semibold">Sign Out Confirmation</h3>
            </div>
            <p className="text-navy-300 mb-6">Are you sure you want to sign out?</p>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelSignOut}
                className="px-4 py-2 rounded-lg bg-navy-700 text-navy-300 hover:bg-navy-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-navy-800 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2 bg-navy-700 rounded-lg text-gold-500 hover:bg-navy-600"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Waveform className="w-6 h-6 text-gold-500" />
              <span className="ml-2 text-xl font-bold text-white">Quantum Balance</span>
            </div>
          </div>
          
          {isAuthenticated ? (
            <button 
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="flex items-center space-x-2 p-1"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-navy-700 border border-gold-500">
                <div className="w-full h-full flex items-center justify-center bg-navy-600 text-gold-500">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/login');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-navy-900 rounded-lg text-sm font-medium hover:bg-gold-400"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-64 bg-navy-800 min-h-screen p-4 border-r border-navy-700">
          <SidebarContent 
            navigation={filteredNavigation} 
            location={location} 
            signOut={handleSignOut}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
          />
        </div>

        {/* Sidebar - Mobile */}
        <div
          className={`fixed inset-0 z-30 transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:hidden`}
        >
          <div className="bg-navy-800 w-64 min-h-screen p-4 pt-16 border-r border-navy-700 flex flex-col">
            {isAuthenticated && user && (
              <div className="mb-6 p-4 border-b border-navy-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-navy-700 border border-gold-500">
                    <div className="w-full h-full flex items-center justify-center bg-navy-600 text-gold-500">
                      <User className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.name}</p>
                    <p className="text-navy-400 text-sm">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gold-500/20 text-gold-500 text-xs rounded-full">
                        Administrator
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Scrollable navigation */}
            <div className="overflow-y-auto pr-2 -mr-2">
            <nav className="space-y-2">
                {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-gold-500 text-navy-900' 
                        : 'text-navy-300 hover:bg-navy-700 hover:text-gold-500'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-left">{item.name}</span>
                  </Link>
                );
              })}
              </nav>
            </div>
              
            {/* Auth section - right after navigation */}
            <div className="mt-4 border-t border-navy-700 pt-4">
              {!isAdmin && isAuthenticated && <VerifyEmailButton />}
              
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-navy-300 hover:bg-navy-700 hover:text-gold-500 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-navy-900 hover:bg-gold-400 w-full text-left"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>
          </div>
          <div 
            className="bg-navy-900 bg-opacity-50 absolute inset-0 -z-10"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-x-hidden mt-12 md:mt-0 flex flex-col min-h-screen">
          <div className="flex-grow p-4 md:p-8">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

// SidebarContent component
function SidebarContent({ navigation, location, signOut, isAuthenticated, isAdmin }: SidebarContentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-6">
          <Waveform className="w-8 h-8 text-gold-500" />
          <span className="ml-2 text-xl font-bold text-white">Quantum Balance</span>
        </div>

      {/* Navigation links with scrollbar */}
      <div className="overflow-y-auto pr-2 -mr-2">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-gold-500 text-navy-900' 
                    : 'text-navy-300 hover:bg-navy-700 hover:text-gold-500'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Auth section - right after navigation */}
      <div className="mt-4 border-t border-navy-700 pt-4">
        {!isAdmin && isAuthenticated && <VerifyEmailButton />}

        {isAuthenticated ? (
          <button
            onClick={signOut}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-navy-300 hover:text-gold-500"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-navy-900 hover:bg-gold-400"
          >
            <LogIn className="w-4 h-4" />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Layout; 