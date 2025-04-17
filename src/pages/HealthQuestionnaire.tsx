import React, {useState, useEffect} from 'react'; 
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader2, Check, AlertTriangle, Info, ArrowRight, Package } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import QuestionnaireForm from '../components/questionnaire/QuestionnaireForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePayment from '../components/payment/StripePayment';
import { API_URL } from '../config/constants';
import { toast } from 'react-hot-toast';

// Get publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

type HealthConcern = {
  description: string;
  type: 'acute' | 'chronic';
  severity: 1 | 2 | 3 | 4;
};

type QuestionnaireData = {
  isPregnant: boolean;
  healthConcerns: HealthConcern[];
  painLocations: string[];
  otherPainLocation?: string;
  emotionalState: string;
  toxinExposure: string[];
  lifestyleFactors: string[];
  healingGoals: string[];
};

const HealthQuestionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { 
        state: { 
          from: '/health-questionnaire',
          message: 'Please log in to access the health questionnaire'
        } 
      });
    }
  }, [user, navigate]);

  // Redirect if user's email is not verified
  useEffect(() => {
    if (user && !user.isVerified && !user.isAdmin) {
      // Show error and redirect to verification page
      toast.error('Email verification required to access this feature', {
        duration: 5000,
        position: 'top-center',
      });
      
      navigate('/verify-email', { 
        state: { 
          from: '/health-questionnaire',
          message: 'Please verify your email to continue with the health questionnaire'
        } 
      });
    }
  }, [user, navigate]);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Package information - coming from location state when redirected from packages page
  const [packageId, setPackageId] = useState<string | null>(location.state?.packageId || null);
  const [packageType, setPackageType] = useState<string | null>(location.state?.packageType || null);
  const [packageName, setPackageName] = useState<string | null>(location.state?.packageName || null);
  const [packagePrice, setPackagePrice] = useState<number | null>(location.state?.packagePrice || null);
  
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [hasExistingQuestionnaire, setHasExistingQuestionnaire] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [paymentMode, setPaymentMode] = useState(false);
  const [formData, setFormData] = useState<QuestionnaireData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingData, setExistingData] = useState<QuestionnaireData | null>(null);
  
  // Check if user was redirected from packages page
  const fromPackages = location.state?.fromPackages === true;
  
  // Use these for form initialization, but don't assign to variables to avoid ESLint warnings
  const { reset } = useForm<QuestionnaireData>({
    defaultValues: {
      healthConcerns: [{}, {}, {}] as any[]
    }
  });

  // Load existing questionnaire if available
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await axios.get(`${API_URL}/questionnaires/`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success && response.data.data.questionnaire) {
          // If user already has a questionnaire, set it
          setHasExistingQuestionnaire(true);
          setExistingData(response.data.data.questionnaire);
          
          // If coming from Packages page, we want to continue
          if (fromPackages) {
            // Use existing questionnaire data for the review
            setFormData(response.data.data.questionnaire);
          } else if (!location.state?.updateQuestionnaire) {
            // If not from packages and not updating, redirect to dashboard
            navigate('/dashboard', { 
              state: { 
                message: 'You already have a questionnaire. You can view or update it from your profile.' 
              }
            });
            return;
          }
          
          // If coming from update request, set updating mode
          if (location.state?.updateQuestionnaire) {
            setIsUpdating(true);
          }
          
          // Initialize the form with existing data
          const questionnaireData = response.data.data.questionnaire;
          reset({
            isPregnant: questionnaireData.isPregnant,
            healthConcerns: questionnaireData.healthConcerns.length ? 
              questionnaireData.healthConcerns.concat(Array(Math.max(0, 3 - questionnaireData.healthConcerns.length)).fill({})) : 
              [{}, {}, {}],
            painLocations: questionnaireData.painLocations || [],
            otherPainLocation: questionnaireData.otherPainLocation || '',
            emotionalState: questionnaireData.emotionalState || '',
            toxinExposure: questionnaireData.toxinExposure || [],
            lifestyleFactors: questionnaireData.lifestyleFactors || [],
            healingGoals: questionnaireData.healingGoals || []
          });
        }
      } catch (error) {
        // If 404, likely no questionnaire yet - that's fine
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          console.error('Error fetching questionnaire:', error);
        }
      }
    };
    
    if (user) {
      fetchQuestionnaire();
    }
  }, [user, reset, navigate, fromPackages, location.state]);

  // Toast notification for payment success
  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, navigate]);

  const handleGoBack = () => {
    if (fromPackages) {
      navigate('/packages');
    } else {
      navigate('/dashboard');
    }
  };

  const handleDoItLater = async () => {
    setLoading(true);
    
    try {
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error handling do it later:', error);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: QuestionnaireData, keepOptions?: Record<string, boolean>) => {
    setLoading(true);
    
    try {
      setError(null);
      console.log('Form submitted:', data);
      
      // Save form data for review
      setFormData(data);
      
      // For the new flow: if we're coming from packages, proceed to review
      if (fromPackages) {
        // Always go to review mode when coming from packages
        setFormSubmitted(true);
        setReviewMode(true);
        setLoading(false);
        return;
      }
      
      // Otherwise this is a regular questionnaire submission (not from packages)
      // Determine if this is an update or a new submission
      const endpoint = hasExistingQuestionnaire 
        ? `${API_URL}/questionnaires/update`
        : `${API_URL}/questionnaires/create`;
      
      const method = hasExistingQuestionnaire ? 'put' : 'post';
      
      // Save questionnaire data using the API
      const response = await axios({
        method,
        url: endpoint,
        data: {
          ...data,
          packageId: location.state?.packageId || null,
          packageType: packageType || 'none',
          // Include keepOptions if updating
          ...(hasExistingQuestionnaire && keepOptions ? keepOptions : {})
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // If this was an update, also save to history
        if (hasExistingQuestionnaire) {
          try {
            await axios.post(
              `${API_URL}/questionnaires/history`,
              {},
              {
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
          } catch (historyError) {
            console.error('Error saving questionnaire history:', historyError);
            // Don't fail the entire process if history saving fails
          }
        }
        
        // Check if user has an active package
        const userResponse = await axios.get(`${API_URL}/packages/user/active`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (userResponse.data.success && userResponse.data.packageInfo) {
          // User has an active package, redirect to dashboard
          navigate('/dashboard', { 
            state: { 
              success: `Questionnaire ${hasExistingQuestionnaire ? 'updated' : 'saved'} successfully` 
            } 
          });
        } else {
          // User doesn't have an active package, redirect to packages page
          navigate('/packages', { 
            state: { 
              message: `Questionnaire ${hasExistingQuestionnaire ? 'updated' : 'saved'} successfully. Now you need to select a package to generate prescriptions.` 
            } 
          });
        }
      } else {
        throw new Error(response.data.message || `Failed to ${hasExistingQuestionnaire ? 'update' : 'save'} questionnaire`);
      }
    } catch (error: any) {
      console.error('Error submitting questionnaire:', error);
      setError(error.response?.data?.message || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setReviewMode(false);
    setPaymentMode(true);
    
    try {
      // Save questionnaire data first
      await axios.post(
        `${API_URL}/questionnaires/create`,
        {
          ...formData,
          packageId: packageId || null,
          packageType: packageType || 'none'
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error: any) {
      console.error('Error saving questionnaire before payment:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save questionnaire');
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In our new flow, we first confirm the payment with our server
      // This will verify with Stripe that the payment succeeded before provisioning any resources
      const response = await axios.post(
        `${API_URL}/stripe/confirm-payment`,
        {
          paymentIntentId: paymentId,
          packageId: packageId
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update user info in context if needed
        if (updateUser) {
          // Make sure the user object has the package ID included
          const userData = response.data.data.user;
          
          // Update the user context
          updateUser(userData);
        }
        
        // Set payment success
        setPaymentSuccess(true);
        setPaymentMode(false);
        
        // Always navigate to dashboard regardless of prescription status
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              success: 'Payment successful! Your package has been activated.',
              newPurchase: true,
              // Include information about prescription if it was generated
              ...(response.data.data.prescription && response.data.data.prescription.generated && {
                prescriptionGenerated: true
              })
            } 
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to process package purchase');
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      setError(error.response?.data?.message || error.message || 'Error processing your purchase');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };
  
  const handleCancelPayment = () => {
    setPaymentMode(false);
    setReviewMode(true);
  };

  // Add a function to handle when the user wants to keep their existing data
  const handleKeepExistingData = async () => {
    setLoading(true);
    
    try {
      setError(null);
      
      // Make an API call to update the questionnaire but specify to keep all existing data
      const response = await axios.put(
        `${API_URL}/questionnaires/update?keepExisting=true`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // If from packages page, proceed to package selection
        if (fromPackages) {
          // Use the existing data for review
          setFormData(existingData || null);
          setFormSubmitted(true);
          setReviewMode(true);
        } else {
          // Otherwise, go back to dashboard
          navigate('/dashboard', { 
            state: { 
              success: 'Keeping your existing questionnaire data' 
            } 
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to process your request');
      }
    } catch (error: any) {
      console.error('Error keeping existing data:', error);
      setError(error.response?.data?.message || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Include this just before the renderQuestionnaireForm function
  const handleFormSubmitWithOptions = (data: QuestionnaireData, keepOptions?: Record<string, boolean>) => {
    onSubmit(data, keepOptions);
  };

  // Function to render the questionnaire form
  const renderQuestionnaireForm = () => (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {hasExistingQuestionnaire && (
        <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg text-indigo-300 flex items-start">
          <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-white">You already have a questionnaire on file.</p>
            <p className="mt-1">You can update it below or keep your existing data.</p>
            <button
              type="button"
              onClick={handleKeepExistingData}
              className="mt-3 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Keep Existing Data
            </button>
          </div>
        </div>
      )}
      
      <QuestionnaireForm
        onSubmit={handleFormSubmitWithOptions}
        onCancel={handleDoItLater}
        loading={loading}
        error={error}
        hasExistingQuestionnaire={hasExistingQuestionnaire}
        defaultData={formData}
        onGoBack={handleGoBack}
        disabled={false}
      />
    </div>
  );

  // Function to render the review summary
  const renderReviewSummary = () => {
    const getPackageName = () => packageName || 'Unknown Package';
    const getPackagePrice = () => packagePrice ? `$${packagePrice}` : '$0';
    const getPackageDuration = () => {
      if (!packageType) return 'Unknown';
      
      switch (packageType) {
        case 'single': return '7 days';
        case 'basic': return '30 days';
        case 'enhanced': return '90 days (3 months)';
        case 'premium': return '365 days (1 year)';
        default: return 'Unknown';
      }
    };

    return (
      <div className="space-y-8">
        <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
          <h2 className="text-xl font-semibold text-white mb-4">Review and Confirm</h2>
          
          <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-amber-300">
              <strong>Important:</strong> You will not be able to change your questionnaire answers until your package expires. Please review your information carefully before proceeding.
            </p>
          </div>

          {/* Package Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gold-500 mb-3">Package Details</h3>
            <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-navy-300 mb-1">Selected Package:</p>
                  <p className="text-white text-lg font-medium">{getPackageName()}</p>
                </div>
                <div>
                  <p className="text-navy-300 mb-1">Price:</p>
                  <p className="text-white text-lg font-medium">{getPackagePrice()}</p>
                </div>
                <div>
                  <p className="text-navy-300 mb-1">Duration:</p>
                  <p className="text-white">{getPackageDuration()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Questionnaire Summary */}
          <div>
            <h3 className="text-lg font-medium text-gold-500 mb-3">Health Questionnaire Summary</h3>
            <div className="space-y-4">
              {/* Basic Health Information */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Basic Health Information</h4>
                <p className="text-navy-300">
                  Pregnant or possibly pregnant: <span className="text-white">{formData?.isPregnant ? 'Yes' : 'No'}</span>
                </p>
              </div>

              {/* Health Concerns */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Health Concerns</h4>
                {formData?.healthConcerns?.filter(concern => concern.description).map((concern, index) => (
                  <div key={index} className="mb-3 pb-3 border-b border-navy-700 last:border-b-0 last:mb-0 last:pb-0">
                    <p className="text-navy-300">
                      Concern {index + 1}: <span className="text-white">{concern.description}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-6 mt-1 text-sm">
                      <p className="text-navy-400">
                        Type: <span className="text-navy-300 capitalize">{concern.type?.replace('_', ' ')}</span>
                      </p>
                      <p className="text-navy-400">
                        Severity: <span className="text-navy-300">{concern.severity} - {concern.severity === 1 ? 'Mild' : concern.severity === 2 ? 'Moderate' : concern.severity === 3 ? 'Significant' : 'Severe'}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {(!formData?.healthConcerns || formData.healthConcerns.filter(c => c.description).length === 0) && (
                  <p className="text-navy-300">No health concerns specified</p>
                )}
              </div>

              {/* Pain Locations */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Pain Locations</h4>
                {formData?.painLocations && formData.painLocations.length > 0 ? (
                  <p className="text-navy-300">
                    Reported pain areas: <span className="text-white">{formData.painLocations.map(loc => loc.replace('_', ' ')).join(', ')}</span>
                  </p>
                ) : (
                  <p className="text-navy-300">No pain locations reported</p>
                )}
                {formData?.otherPainLocation && (
                  <p className="text-navy-300 mt-2">
                    Other areas: <span className="text-white">{formData.otherPainLocation}</span>
                  </p>
                )}
              </div>

              {/* Emotional State */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Emotional Wellbeing</h4>
                <p className="text-navy-300">
                  Current emotional state: <span className="text-white capitalize">{formData?.emotionalState?.replace('_', ' ')}</span>
                </p>
              </div>

              {/* Environmental Factors */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Environmental Factors</h4>
                <p className="text-navy-300 mb-2">
                  Toxin exposures: {formData?.toxinExposure && formData.toxinExposure.length > 0 ? (
                    <span className="text-white">{formData.toxinExposure.map(exp => exp.replace('_', ' ')).join(', ')}</span>
                  ) : (
                    <span className="text-white">None reported</span>
                  )}
                </p>
                <p className="text-navy-300">
                  Lifestyle factors: {formData?.lifestyleFactors && formData.lifestyleFactors.length > 0 ? (
                    <span className="text-white">{formData.lifestyleFactors.map(factor => factor.replace('_', ' ')).join(', ')}</span>
                  ) : (
                    <span className="text-white">None reported</span>
                  )}
                </p>
              </div>

              {/* Healing Goals */}
              <div className="bg-navy-750 p-4 rounded-lg border border-navy-600">
                <h4 className="font-medium text-white mb-2">Healing Goals</h4>
                {formData?.healingGoals && formData.healingGoals.length > 0 ? (
                  <p className="text-navy-300">
                    Selected goals: <span className="text-white">{formData.healingGoals.map(goal => goal.replace('_', ' ')).join(', ')}</span>
                  </p>
                ) : (
                  <p className="text-navy-300">No healing goals specified</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Review buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setFormSubmitted(false)}
            className="py-2 px-6 bg-navy-700 text-navy-300 rounded-lg font-medium hover:bg-navy-600 transition-colors"
          >
            Back to Questionnaire
          </button>
          
          <button
            type="button"
            onClick={handleProceedToPayment}
            className="py-2 px-6 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                Proceed to Payment
                <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Function to render the payment form
  const renderPaymentForm = () => (
    <div className="space-y-6">
      <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
        <div className="flex items-center mb-4">
          <Package className="text-gold-500 w-6 h-6 mr-2" />
          <h2 className="text-xl font-semibold text-white">Complete Your Purchase</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-navy-700/60 rounded-lg mb-6">
          <div>
            <p className="text-gray-300 text-sm">Selected Package:</p>
            <p className="text-white font-medium">{packageName}</p>
          </div>
          <div>
            <p className="text-gray-300 text-sm">Price:</p>
            <p className="text-gold-400 font-bold">${packagePrice}</p>
          </div>
        </div>
        
        <Elements stripe={stripePromise}>
          <StripePayment
            packageId={packageId || ''}
            packageName={packageName || ''}
            packagePrice={packagePrice || 0}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={handleCancelPayment}
          />
        </Elements>
      </div>
    </div>
  );

  // Payment success screen
  const renderPaymentSuccess = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
      <p className="text-navy-300 mb-6">Your payment has been processed successfully.</p>
      <p className="text-navy-300">Redirecting to dashboard...</p>
    </div>
  );

  // Render intro section with different message if updating
  const renderIntro = () => (
    <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-6 rounded-xl shadow-xl mb-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">
        {isUpdating ? 'Update Your Health Profile' : fromPackages ? 'Complete Your Health Questionnaire' : 'Health Questionnaire'}
      </h1>
      <p className="text-gray-200 mb-4">
        {isUpdating
          ? 'Your health is a journey. Update your information below to help us provide the most effective care.'
          : fromPackages
          ? `You've selected the ${packageName} package. Now complete this questionnaire to create your personalized healing plan.`
          : 'Complete this questionnaire to help us understand your health needs and create a personalized treatment plan.'}
      </p>
      {isUpdating && (
        <div className="bg-blue-800 p-4 rounded-lg text-white mt-4">
          <h3 className="font-medium flex items-center gap-2 mb-1">
            <Info size={18} />
            Update Options
          </h3>
          <p className="text-sm text-blue-100">
            You can now choose to update specific sections or keep your previous answers.
            Click the "Update" or "Keep Existing" button in each section to toggle.
          </p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-900/60 border border-red-700 rounded-lg text-white flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900 text-white pb-12">
      {paymentSuccess ? (
        renderPaymentSuccess()
      ) : (
        <div className="container mx-auto px-4">
          <div className="py-8">
            {renderIntro()}
            
            {!formSubmitted && !paymentMode && renderQuestionnaireForm()}
            
            {formSubmitted && reviewMode && !paymentMode && renderReviewSummary()}
            
            {paymentMode && renderPaymentForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthQuestionnaire; 