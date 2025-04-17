import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminVerification from '../../components/auth/AdminVerification';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    login, 
    loading: authLoading, 
    error: authError, 
    requiresAdminVerification
  } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  // If admin verification is required, show the verification screen
  if (requiresAdminVerification) {
    return <AdminVerification />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      setError('Please enter both username/email and password');
      return;
    }
    
    // Regular login flow
    setLoading(true);
    setError(null);
    
    try {
      await login(username, password, false);
      // Redirect to the page they were trying to access or dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      // Check if this is a verification required error
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        // Redirect to verification page
        navigate('/verify-email', { 
          state: { 
            from,
            email: err.response.data.email 
          }
        });
      } else if (err.response?.status === 403 && err.response?.data?.requiresAdminVerification) {
        // Admin verification is handled by the useAuth context and the if condition above
        // No need to do anything here as the component will re-render
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-navy-300 mt-2">
            Sign in to access your quantum healing dashboard
          </p>
        </div>
        
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          {(error || authError) && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error || authError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-navy-300 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-navy-500" />
                </div>
                <input
                  id="username"
                  type="text"
                  className="w-full pl-10 pr-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-navy-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-navy-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="w-full pl-10 pr-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-sm text-gold-500 hover:text-gold-400">
                  Forgot password?
                </Link>
              </div>
            </div>
                
            <button
              type="submit"
              className="w-full py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition flex items-center justify-center"
              disabled={loading || authLoading}
            >
              {(loading || authLoading) ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-navy-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold-500 hover:text-gold-400 font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 