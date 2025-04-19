import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '../config/constants';

// API URL - use the constant instead of hardcoded value
// const API_URL = '${API_URL}';

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
  preferredCurrency?: string;
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
  verifyAdminLogin: (email: string, otp: string) => Promise<void>;
  resendAdminVerificationCode: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
  isVerified: boolean;
  requiresVerification: boolean;
  requiresAdminVerification: boolean;
  pendingVerificationEmail: string | null;
  pendingAdminEmail: string | null;
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
  const [requiresAdminVerification, setRequiresAdminVerification] = useState<boolean>(false);
  const [pendingAdminEmail, setPendingAdminEmail] = useState<string | null>(null);

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
      
      console.log('Checking package expiry for user:', userId);
      const response = await axios.get(
        `${API_URL}/packages/check-expiry`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Package expiry check response:', response.data);
      
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
        setRequiresAdminVerification(false);
        setPendingVerificationEmail(null);
        setPendingAdminEmail(null);
        
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
      // Check if the error is related to admin verification
      else if (err.response?.status === 403 && err.response?.data?.requiresAdminVerification) {
        setRequiresAdminVerification(true);
        setPendingAdminEmail(err.response.data.email);
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
      
      return response.data;
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
        console.log('Verification code sent');
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify admin login with OTP
  const verifyAdminLogin = async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Before verification:", { 
        requiresAdminVerification, 
        pendingAdminEmail, 
        userIsAdmin: user?.isAdmin,
        token: !!localStorage.getItem('token')
      });

      const response = await axios.post(`${API_URL}/auth/admin/verify-otp`, {
        email,
        otp
      });

      if (response.data.success) {
        console.log("Admin verification successful", response.data);
        
        // Store token in localStorage BEFORE updating state
        // This ensures the token is available for subsequent navigation
        if (response.data.token) {
          console.log("Setting token in localStorage");
          localStorage.setItem('token', response.data.token);
          // Set default Authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        // Now update user data and state flags
        setUser(response.data.user);
        setRequiresAdminVerification(false);
        setPendingAdminEmail(null);
        
        // Double-check token is properly stored
        const storedToken = localStorage.getItem('token');
        console.log("Token verification:", {
          tokenReceived: !!response.data.token,
          tokenStored: !!storedToken,
          tokenMatches: storedToken === response.data.token
        });
        
        console.log("After verification:", { 
          requiresAdminVerification: false, 
          pendingAdminEmail: null, 
          userIsAdmin: response.data.user?.isAdmin,
          token: !!localStorage.getItem('token')
        });
        
        // One final attempt to make sure axios default headers are set
        if (storedToken) {
          console.log("Reinforcing axios Authorization header");
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      }
      
      return response.data;
    } catch (err: any) {
      console.error("Admin verification error:", err);
      setError(err.response?.data?.message || 'Admin verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resend admin verification code
  const resendAdminVerificationCode = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/admin/generate-otp`, {
        email
      });

      if (response.data.success) {
        console.log('Admin verification code sent');
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send admin verification code');
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
    verifyAdminLogin,
    resendAdminVerificationCode,
    updateUser,
    refreshUserData,
    isVerified,
    requiresVerification,
    requiresAdminVerification,
    pendingVerificationEmail,
    pendingAdminEmail
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
