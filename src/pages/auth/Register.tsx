import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle, User, Globe, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Custom styles for the phone input to match our dark theme
const phoneInputCustomStyles = `
  .phone-input-container {
    width: 100%;
  }
  .phone-input-container .form-control {
    height: 42px !important;
    width: 100% !important;
    background-color: #171e31 !important;
    border-color: #2d3748 !important;
    color: white !important;
  }
  .phone-input-container .flag-dropdown {
    background-color: #171e31 !important;
    border-color: #2d3748 !important;
  }
  .phone-input-container .selected-flag:hover,
  .phone-input-container .selected-flag:focus {
    background-color: #1a202c !important;
  }
  .phone-input-container .country-list {
    background-color: #171e31 !important;
    border-color: #2d3748 !important;
  }
  .phone-input-container .country-list .country:hover {
    background-color: #1a202c !important;
  }
  .phone-input-container .country-list .country.highlight {
    background-color: #2d3748 !important;
  }
  .phone-input-container .country-list .country-name,
  .phone-input-container .country-list .dial-code {
    color: white !important;
  }
  .phone-input-container .arrow {
    border-top-color: #6b7280 !important;
  }
`;

interface RegisterFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  age: number;
  isNotPregnant: boolean;
  agreedToTerms: boolean;
  agreedNotMedical: boolean;
  agreedNotEmergency: boolean;
}

interface Country {
  name: string;
  code: string;
}

// Define the Register component
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      agreedToTerms: false,
      agreedNotMedical: false,
      agreedNotEmergency: false,
      isNotPregnant: false
    }
  });

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        const data = await response.json();
        
        // Sort countries alphabetically by name
        const sortedCountries = data
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        
        setCountries(sortedCountries);
      } catch (err) {
        console.error('Error fetching countries:', err);
        // Fallback to a few common countries if API fails
        setCountries([
          { name: 'United States', code: 'US' },
          { name: 'United Kingdom', code: 'GB' },
          { name: 'Canada', code: 'CA' },
          { name: 'Australia', code: 'AU' },
          { name: 'India', code: 'IN' }
        ]);
      } finally {
        setLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

  const password = watch('password');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      
      // Create a preview URL using resized image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          // Set max dimensions (256x256 pixels is enough for profile pictures)
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          
          let width = img.width;
          let height = img.height;
          
          // Resize image while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image on canvas
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed data URL (JPEG at 80% quality)
          const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Update state with the compressed image
          setPreviewUrl(resizedImageUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  // Update to store the formatted phone number display
  const handlePhoneChange = (value: string, country: any, e: any, formattedValue: string) => {
    setPhoneNumber(value); // This is still what react-phone-input-2 provides
    
    // Create a formatted version with proper symbols for display and storage
    let formatted = '';
    if (country && country.dialCode) {
      formatted = `+${country.dialCode} ${value.substring(country.dialCode.length)}`;
    } else {
      formatted = `+${value}`;
    }
    setFormattedPhoneNumber(formatted);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (!data.agreedToTerms || !data.agreedNotMedical || !data.agreedNotEmergency || !data.isNotPregnant) {
        setError('Please agree to all the required terms');
        setLoading(false);
        return;
      }

      if (!phoneNumber) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }

      // Register user with backend
      await registerUser(
        data.name, 
        data.email, 
        data.username, 
        data.password, 
        formattedPhoneNumber || phoneNumber, // Send the formatted number, fall back to raw number if needed
        previewUrl || undefined
      );
      
      setSuccess(true);
      
      // Navigate to dashboard since we're skipping email verification
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error('Error registering:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <style>{phoneInputCustomStyles}</style>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">Create Your Account</h1>
          <p className="text-navy-300">
            Begin your journey to quantum healing today
          </p>
        </div>

        {success ? (
          <div className="bg-navy-800 rounded-lg p-8 border border-navy-700 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Registration Successful</h2>
            <p className="text-navy-300 mb-6">
              Your account has been created successfully. You'll now be redirected to your dashboard.
            </p>
            <p className="text-navy-400 text-sm">Redirecting...</p>
          </div>
        ) : (
          <div className="bg-navy-800 rounded-lg p-6 shadow-lg border border-navy-700">
            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <div 
                    className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer border-2 border-navy-600 hover:border-gold-500 transition-colors"
                    onClick={handleProfilePictureClick}
                  >
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-navy-700 text-navy-400">
                        <User className="w-10 h-10 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <span className="mt-2 text-sm text-navy-400">Profile Picture (Optional)</span>
                  {error && error.includes('Image size') && (
                    <span className="mt-1 text-xs text-red-400">{error}</span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-navy-300 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Please enter a valid email'
                    } 
                  })}
                  className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-navy-300 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    }
                  })}
                  className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-navy-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneInput
                    country={'us'}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    inputProps={{
                      name: 'phone',
                      id: 'phone',
                      required: true,
                    }}
                    inputClass="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    buttonClass="bg-navy-750 border-r-0 border-navy-600 rounded-l-md"
                    dropdownClass="bg-navy-750 text-white"
                    containerClass="phone-input-container"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-navy-300 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="w-full p-3 bg-navy-700 border border-navy-600 rounded-lg text-white"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    className="w-full p-3 bg-navy-700 border border-navy-600 rounded-lg text-white"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-navy-300 mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      id="country"
                      {...register('country', { required: 'Country is required' })}
                      className="w-full p-3 bg-navy-700 border border-navy-600 rounded-lg text-white appearance-none"
                      disabled={loadingCountries}
                    >
                      <option value="">Select your country</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 pointer-events-none" />
                  </div>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-navy-300 mb-1">
                    Age
                  </label>
                  <div className="relative">
                    <input
                      id="age"
                      type="number"
                      min="18"
                      max="120"
                      {...register('age', { 
                        required: 'Age is required',
                        min: {
                          value: 18,
                          message: 'You must be at least 18 years old'
                        },
                        max: {
                          value: 120,
                          message: 'Please enter a valid age'
                        }
                      })}
                      className="w-full p-3 bg-navy-700 border border-navy-600 rounded-lg text-white"
                      placeholder="Your age"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 pointer-events-none" />
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-400">{errors.age.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="font-medium text-gold-500">Terms & Conditions</h3>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isNotPregnant"
                      type="checkbox"
                      {...register('isNotPregnant', { required: true })}
                      className="h-4 w-4 text-gold-500 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="isNotPregnant" className="text-sm text-white">
                      I confirm that I am not pregnant, as quantum frequencies may pose risks during pregnancy.
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreedToTerms"
                      type="checkbox"
                      {...register('agreedToTerms', { required: true })}
                      className="h-4 w-4 text-gold-500 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="agreedToTerms" className="text-sm text-white">
                      I agree to the <Link to="/terms" className="text-gold-500 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-gold-500 hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreedNotMedical"
                      type="checkbox"
                      {...register('agreedNotMedical', { required: true })}
                      className="h-4 w-4 text-gold-500 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="agreedNotMedical" className="text-sm text-white">
                      I understand that Quantum Balance is not a substitute for professional medical treatment.
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreedNotEmergency"
                      type="checkbox"
                      {...register('agreedNotEmergency', { required: true })}
                      className="h-4 w-4 text-gold-500 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="agreedNotEmergency" className="text-sm text-white">
                      I agree to seek immediate medical attention for any emergency conditions.
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gold-500 text-navy-900 font-semibold rounded-lg hover:bg-gold-400 transition flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-navy-900 border-t-transparent mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="text-navy-300">
                Already have an account?{' '}
                <Link to="/login" className="text-gold-500 hover:text-gold-400">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register; 