import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5000/api';

// User interface
interface User {
  createdAt: any;
  joiningDate: any;
  _id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  profile: {
    avatar?: string;
    bio?: string;
  };
  profilePicture?: string | null;
  packageType: string;
  isAdmin: boolean;
  isVerified: boolean;
  activePackage?: {
    packageId?: string;
    name: string;
    expiresAt?: string;
  } | null;
  healthQuestionnaire?: {
    isPregnant: boolean;
    healthConcerns: Array<{
      description: string;
      type: 'acute' | 'chronic';
      severity: 1 | 2 | 3 | 4;
    }>;
    painLocations: string[];
    otherPainLocation?: string;
    emotionalState: string;
    toxinExposure: string[];
    lifestyleFactors: string[];
    healingGoals: string[];
    createdAt?: Date;
    updatedAt?: Date;
    selectedPackage?: {
      packageId: string | null;
      packageType: string;
    };
  } | null;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (name: string, email: string, username: string, password: string, phone: string, profilePhoto?: string) => Promise<void>;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
  isVerified: boolean;
  requiresVerification: boolean;
  pendingVerificationEmail: string | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState<boolean>(false);

  // Configure axios to send credentials with requests
  axios.defaults.withCredentials = true;

  // Setup axios interceptor to add token to all requests
  useEffect(() => {
    // Add a request interceptor
    const interceptor = axios.interceptors.request.use(
      config => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // If token exists, add it to the request headers
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
          // Set the Authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(`${API_URL}/auth/user`);
        if (response.data.success) {
          console.log('User authenticated:', response.data.user);
          setUser(response.data.user);
          
          // Only check package status if user has an active package
          if (response.data.user.packageType !== 'none') {
            await checkPackageExpiry(response.data.user._id);
          }
        }
      } catch (err) {
        // User is not logged in, don't set an error
        console.log('User not authenticated');
        
        // Clear any existing token as it might be invalid
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Function to check if the user's package has expired
  const checkPackageExpiry = async (userId: string) => {
    try {
      // Only check if we have a token
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.post(
        `${API_URL}/packages/check-expiry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success && response.data.updated) {
        console.log('Package expired and updated');
        // Update user state with the updated user info
        setUser(prev => {
          if (prev && prev._id === userId) {
            return {
              ...prev,
              packageType: 'none',
              activePackage: null
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error checking package expiry:', error);
    }
  };

  // Refresh user data function - used when explicitly needed
  const refreshUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/user`);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, username: string, password: string, phone: string, profilePhoto?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        username,
        password,
        phone,
        profilePhoto
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, isAdmin: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: email,
        password,
        isAdmin
      });

      if (response.data.success) {
        setUser(response.data.user);
        setRequiresVerification(false);
        setPendingVerificationEmail(null);
        
        // Store token in localStorage if it's returned from the API
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Set default Authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
      }
    } catch (err: any) {
      // Check if the error is related to verification
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setPendingVerificationEmail(err.response.data.email);
      }
      
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      await axios.post(`${API_URL}/auth/logout`);
      setUser(null);
      
      // Clear token from localStorage
      localStorage.removeItem('token');
      // Remove Authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (err: any) {
      setError(err.response?.data?.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify email function
  const verifyEmail = async (email: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/verify-email`, {
        email,
        code
      });

      if (response.data.success) {
        // Update user data with verified status
        setUser(response.data.user);
        setRequiresVerification(false);
        setPendingVerificationEmail(null);
        
        // Store token in localStorage if it's returned from the API
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Set default Authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const resendVerificationCode = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/send-verification`, {
        email
      });

      if (response.data.success) {
        // In a real app, we wouldn't do anything with the code here
        // It would be sent directly to the user's email
        console.log('Verification code sent');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Computed property for verification status
  const isVerified = !!user?.isVerified;

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    verifyEmail,
    resendVerificationCode,
    updateUser,
    refreshUserData,
    isVerified,
    requiresVerification,
    pendingVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 