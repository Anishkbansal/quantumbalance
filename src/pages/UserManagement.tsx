import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, X, Check, MoreHorizontal, FileEdit, UserX, Users, Trash, User, Package, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

// Data interfaces
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  package_type: 'none' | 'single' | 'basic' | 'enhanced' | 'premium';
  package_expiry: string | null;
  hasCompletedQuestionnaire: boolean;
  questionnaire?: {
    isPregnant: boolean;
    healthConcerns: Array<{
      description: string;
      type: string;
      severity: number;
    }>;
    painLocations: string[];
    otherPainLocation?: string;
    emotionalState: string;
    toxinExposure: string[];
    lifestyleFactors: string[];
    healingGoals: string[];
    lastUpdated: string | null;
  };
  createdAt: string;
}

// Mock user data for frontend-only display
const MOCK_USERS: UserData[] = [
  {
    _id: '1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    package_type: 'premium',
    package_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    hasCompletedQuestionnaire: true,
    questionnaire: {
      isPregnant: false,
      healthConcerns: [
        { description: 'Chronic fatigue', type: 'chronic', severity: 3 },
        { description: 'Migraine headaches', type: 'acute', severity: 4 }
      ],
      painLocations: ['head', 'neck', 'lower_back'],
      emotionalState: 'stressed',
      toxinExposure: ['chemicals', 'emf'],
      lifestyleFactors: ['sedentary', 'poor_sleep'],
      healingGoals: ['reduce_pain', 'improve_energy', 'better_sleep'],
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    package_type: 'basic',
    package_expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    hasCompletedQuestionnaire: true,
    questionnaire: {
      isPregnant: false,
      healthConcerns: [
        { description: 'Back pain', type: 'chronic', severity: 2 }
      ],
      painLocations: ['upper_back', 'lower_back'],
      emotionalState: 'anxious',
      toxinExposure: ['pesticides'],
      lifestyleFactors: ['high_stress', 'poor_diet'],
      healingGoals: ['reduce_pain', 'reduce_anxiety'],
      lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '3',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'admin',
    package_type: 'premium',
    package_expiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    hasCompletedQuestionnaire: true,
    questionnaire: {
      isPregnant: false,
      healthConcerns: [
        { description: 'Insomnia', type: 'chronic', severity: 3 },
        { description: 'Digestive issues', type: 'chronic', severity: 2 }
      ],
      painLocations: ['abdomen'],
      emotionalState: 'overwhelmed',
      toxinExposure: ['mold', 'heavy_metals'],
      lifestyleFactors: ['poor_sleep', 'high_stress'],
      healingGoals: ['better_sleep', 'digestive_health', 'emotional_healing'],
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '4',
    name: 'Robert Wilson',
    email: 'robert@example.com',
    role: 'user',
    package_type: 'none',
    package_expiry: null,
    hasCompletedQuestionnaire: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '5',
    name: 'Emily Johnson',
    email: 'emily@example.com',
    role: 'user',
    package_type: 'single',
    package_expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    hasCompletedQuestionnaire: true,
    questionnaire: {
      isPregnant: true,
      healthConcerns: [
        { description: 'Morning sickness', type: 'acute', severity: 2 },
        { description: 'Fatigue', type: 'chronic', severity: 2 }
      ],
      painLocations: ['lower_back'],
      emotionalState: 'anxious',
      toxinExposure: [],
      lifestyleFactors: ['sedentary'],
      healingGoals: ['reduce_anxiety', 'improve_energy'],
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Load mock users on component mount
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const toggleUserExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };
  
  const handleUpdatePackage = async (userId: string, packageType: string) => {
    try {
      // Simulate API call
      setLoading(true);
      
      // Wait for "API" response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the user in our local state
      setUsers(prevUsers => prevUsers.map(user => {
        if (user._id === userId) {
          // Calculate expiry based on package
          let expiryDate = null;
          const now = new Date();
          
          switch(packageType) {
            case 'single':
              expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'basic':
              expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              break;
            case 'enhanced':
              expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
              break;
            case 'premium':
              expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
              break;
          }
          
          return {
            ...user,
            package_type: packageType as any,
            package_expiry: expiryDate ? expiryDate.toISOString() : null
          };
        }
        return user;
      }));
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error updating package:', error);
      setError('Failed to update package');
      setLoading(false);
    }
  };
  
  const getPackageLabel = (packageType: string) => {
    switch (packageType) {
      case 'none': return 'No Package';
      case 'single': return 'Single Session';
      case 'basic': return 'Basic Plan';
      case 'enhanced': return 'Enhanced Plan';
      case 'premium': return 'Premium Plan';
      default: return packageType;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-navy-900 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">User Management</h1>
          <p className="text-navy-300">Manage all system users, their packages, and questionnaire data.</p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        
        <div className="mb-6 relative">
          <div className="flex items-center border border-navy-700 bg-navy-800 rounded-lg p-2">
            <Search className="text-navy-400 ml-2" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-transparent border-none px-3 py-2 text-white focus:outline-none"
              placeholder="Search users by name or email..."
            />
          </div>
        </div>
        
        <div className="overflow-hidden bg-navy-800 rounded-lg border border-navy-700 mb-8">
          <table className="min-w-full divide-y divide-navy-700">
            <thead className="bg-navy-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-navy-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-navy-300 uppercase tracking-wider">
                  Package
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-navy-300 uppercase tracking-wider">
                  Questionnaire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-navy-300 uppercase tracking-wider">
                  Registered
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-navy-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-navy-300">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <tr className="hover:bg-navy-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-navy-700 flex items-center justify-center border border-navy-600">
                            <User className="h-5 w-5 text-navy-300" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-navy-300">{user.email}</div>
                            <div className="text-xs text-navy-400">
                              {user.role === 'admin' ? (
                                <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-500">Admin</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-navy-600 text-navy-300">User</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white capitalize">
                          {getPackageLabel(user.package_type)}
                        </div>
                        {user.package_expiry && (
                          <div className="text-xs text-navy-300">
                            Expires: {formatDate(user.package_expiry)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.hasCompletedQuestionnaire ? (
                          <div>
                            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs">
                              Completed
                            </span>
                            {user.questionnaire?.lastUpdated && (
                              <div className="text-xs text-navy-300 mt-1">
                                Updated: {formatDate(user.questionnaire.lastUpdated)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-navy-600 text-navy-300 text-xs">
                            Not Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-300">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button 
                            onClick={() => toggleUserExpand(user._id)}
                            className="text-navy-300 hover:text-gold-500 transition-colors"
                          >
                            {expandedUser === user._id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded User Details */}
                    {expandedUser === user._id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-navy-750">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gold-500 mb-3">User Actions</h3>
                            <div className="flex flex-wrap gap-2">
                              {/* Update Package Options */}
                              <div className="p-3 bg-navy-700 rounded-md border border-navy-600">
                                <h4 className="text-white text-sm font-medium mb-2">Update Package</h4>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleUpdatePackage(user._id, 'none')}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      user.package_type === 'none' 
                                        ? 'bg-navy-600 text-white' 
                                        : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                                    }`}
                                  >
                                    None
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePackage(user._id, 'single')}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      user.package_type === 'single' 
                                        ? 'bg-gold-500 text-navy-900' 
                                        : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                                    }`}
                                  >
                                    Single
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePackage(user._id, 'basic')}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      user.package_type === 'basic' 
                                        ? 'bg-gold-500 text-navy-900' 
                                        : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                                    }`}
                                  >
                                    Basic
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePackage(user._id, 'enhanced')}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      user.package_type === 'enhanced' 
                                        ? 'bg-gold-500 text-navy-900' 
                                        : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                                    }`}
                                  >
                                    Enhanced
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePackage(user._id, 'premium')}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      user.package_type === 'premium' 
                                        ? 'bg-gold-500 text-navy-900' 
                                        : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                                    }`}
                                  >
                                    Premium
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {user.hasCompletedQuestionnaire && user.questionnaire && (
                            <div>
                              <h3 className="text-lg font-semibold text-gold-500 mb-3">Health Questionnaire Summary</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-navy-700 rounded-md border border-navy-600">
                                  <h4 className="text-white text-sm font-medium mb-2">Health Concerns</h4>
                                  {user.questionnaire.healthConcerns.length > 0 ? (
                                    <ul className="space-y-2">
                                      {user.questionnaire.healthConcerns.map((concern, index) => (
                                        concern.description && (
                                          <li key={index} className="text-navy-300 text-sm">
                                            <span className="text-white">{concern.description}</span>
                                            <div className="text-xs">
                                              {concern.type}, Severity: {concern.severity}/4
                                            </div>
                                          </li>
                                        )
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-navy-300 text-sm">No health concerns listed</p>
                                  )}
                                </div>
                                
                                <div className="p-3 bg-navy-700 rounded-md border border-navy-600">
                                  <h4 className="text-white text-sm font-medium mb-2">Pain & Emotional State</h4>
                                  <div className="text-navy-300 text-sm mb-2">
                                    <span className="text-navy-400">Emotional State: </span>
                                    <span className="text-white capitalize">{user.questionnaire.emotionalState || 'Not specified'}</span>
                                  </div>
                                  <div className="text-navy-300 text-sm">
                                    <span className="text-navy-400">Pain Locations: </span>
                                    {user.questionnaire.painLocations.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {user.questionnaire.painLocations.map((location, index) => (
                                          <span key={index} className="px-2 py-0.5 bg-navy-600 rounded-full text-xs">
                                            {location.replace('_', ' ')}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span>None specified</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-navy-700 rounded-md border border-navy-600">
                                  <h4 className="text-white text-sm font-medium mb-2">Healing Goals</h4>
                                  {user.questionnaire.healingGoals.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {user.questionnaire.healingGoals.map((goal, index) => (
                                        <span key={index} className="px-2 py-0.5 bg-gold-500/20 text-gold-500 rounded-full text-xs">
                                          {goal.replace('_', ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-navy-300 text-sm">No goals specified</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 