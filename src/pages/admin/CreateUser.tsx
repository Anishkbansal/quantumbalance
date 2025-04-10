import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, UserPlus } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
  packageType: string;
}

const CreateUser: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
    packageType: 'none',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Send data to API
      const response = await axios.post('http://localhost:5000/api/auth/admin/create-user', {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        isAdmin: formData.isAdmin,
        packageType: formData.packageType
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess(`User ${formData.name} was created successfully`);
        // Reset form
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          isAdmin: false,
          packageType: 'none',
        });
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">Create New User</h1>
        <p className="text-navy-300">Add a new user to the system</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-md text-green-200 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-navy-800 rounded-lg border border-navy-700 overflow-hidden p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-navy-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-navy-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-navy-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="packageType" className="block text-navy-300 mb-2">
                Package Type
              </label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-navy-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="********"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-navy-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="********"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-navy-600 rounded bg-navy-750"
              />
              <label htmlFor="isAdmin" className="ml-2 block text-navy-300">
                Admin User
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gold-500 text-navy-900 rounded-md flex items-center justify-center hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser; 