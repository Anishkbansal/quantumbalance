import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Moon, Sun, Clock, AlertCircle, Info, BarChart4, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { API_URL } from '../config/constants';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WellnessEntry {
  date: string;
  sleep: number;
  water: number;
  energy: number;
  wellbeing: number;
}

interface WellnessTrackerProps {
  showReminderOnly?: boolean;
  onClose?: () => void;
}

type DateRange = '7d' | '14d' | '30d' | '90d' | '180d';

const WellnessTracker: React.FC<WellnessTrackerProps> = ({ showReminderOnly = false, onClose }) => {
  const [sleep, setSleep] = useState<number>(5);
  const [water, setWater] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [wellbeing, setWellbeing] = useState<number>(5);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [history, setHistory] = useState<WellnessEntry[]>([]);
  const [lastEntry, setLastEntry] = useState<WellnessEntry | null>(null);
  const [showReminder, setShowReminder] = useState<boolean>(showReminderOnly);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [analyticsTrendData, setAnalyticsTrendData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && user.packageType !== 'none') {
      fetchWellnessHistory();
      checkLastEntryTime();
    }
  }, [user]);
  
  useEffect(() => {
    if (showAnalytics) {
      fetchAnalyticsData();
    }
  }, [dateRange, showAnalytics]);
  
  const fetchWellnessHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Check if user has an active package
      if (!user || user.packageType === 'none') {
        setErrorMessage('You need an active package to use the Wellness Tracker');
        return;
      }
      
      const response = await axios.get(`${API_URL}/wellness/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setHistory(response.data.entries);
        
        // Set last entry if available
        if (response.data.entries.length > 0) {
          setLastEntry(response.data.entries[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching wellness history:', error);
    }
  };
  
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/wellness/stats?range=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAnalyticsTrendData(response.data.weeklyTrend);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const checkLastEntryTime = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // First, check if reminder should be shown from API
      const reminderResponse = await axios.get(`${API_URL}/wellness/check-last-entry`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (reminderResponse.data.lastEntry) {
        const lastEntryDate = new Date(reminderResponse.data.lastEntry.date);
        const today = new Date();
        
        // Check if last entry was today
        const isToday = 
          lastEntryDate.getDate() === today.getDate() &&
          lastEntryDate.getMonth() === today.getMonth() &&
          lastEntryDate.getFullYear() === today.getFullYear();
        
        // If we're showing a reminder, respect the API's decision
        if (showReminderOnly) {
          setShowReminder(reminderResponse.data.shouldPrompt && !isToday);
        }
        
        // Set flag to indicate if user has already submitted today
        setHasSubmittedToday(isToday);
      } else {
        // If there's no last entry, user has definitely not submitted today
        setHasSubmittedToday(false);
        
        // If we're showing a reminder, show it if API says so
        if (showReminderOnly) {
          setShowReminder(reminderResponse.data.shouldPrompt);
        }
      }
    } catch (error) {
      console.error('Error checking last entry time:', error);
    }
  };
  
  const handleDoLater = () => {
    if (onClose) {
      onClose();
    } else {
      setShowReminder(false);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitStatus('loading');
      setErrorMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Authentication required');
        setSubmitStatus('error');
        return;
      }
      
      const response = await axios.post(`${API_URL}/wellness/submit`, {
        sleep,
        water,
        energy,
        wellbeing
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSubmitStatus('success');
        // Refresh wellness history
        fetchWellnessHistory();
        // Mark as submitted today
        setHasSubmittedToday(true);
        
        // Reset form after 2 seconds and close
        setTimeout(() => {
          setSubmitStatus('idle');
          if (onClose) {
            onClose();
          } else {
            setShowReminder(false);
          }
        }, 2000);
      } else {
        setErrorMessage(response.data.message || 'Failed to save data');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting wellness data:', error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || 'Server error');
      } else {
        setErrorMessage('Failed to connect to server');
      }
      setSubmitStatus('error');
    }
  };
  
  const handleAnalyticsButtonClick = () => {
    setShowAnalytics(true);
    fetchAnalyticsData();
  };
  
  const closeAnalytics = () => {
    setShowAnalytics(false);
  };
  
  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  const prepareChartData = () => {
    if (!analyticsTrendData || analyticsTrendData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const sortedData = [...analyticsTrendData].sort((a, b) => 
      new Date(a._id).getTime() - new Date(b._id).getTime()
    );
    
    const labels = sortedData.map(item => formatDateLabel(item._id));
    
    return {
      labels,
      datasets: [
        {
          label: 'Sleep',
          data: sortedData.map(item => item.sleep),
          borderColor: 'rgba(106, 90, 205, 1)',
          backgroundColor: 'rgba(106, 90, 205, 0.2)',
          tension: 0.4
        },
        {
          label: 'Water',
          data: sortedData.map(item => item.water),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4
        },
        {
          label: 'Energy',
          data: sortedData.map(item => item.energy),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.4
        },
        {
          label: 'Wellbeing',
          data: sortedData.map(item => item.wellbeing),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    };
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    }
  };
  
  const renderRatingSlider = (
    label: string, 
    value: number, 
    onChange: (value: number) => void, 
    icon: React.ReactNode
  ) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {icon}
          <label className="ml-2 text-white font-medium">{label}</label>
        </div>
        <span className="text-gold-500 font-medium">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-navy-600 rounded-lg appearance-none cursor-pointer accent-gold-500"
      />
      <div className="flex justify-between text-xs text-navy-400 mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
  
  const renderAnalyticsPanel = () => (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-navy-800 p-6 rounded-lg z-10"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gold-500">Wellness Analytics</h2>
        <button 
          onClick={closeAnalytics}
          className="p-2 bg-navy-700 hover:bg-navy-600 rounded-full"
        >
          <ChevronLeft className="h-5 w-5 text-gold-500" />
        </button>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-white">Time Range</h3>
          <div className="flex bg-navy-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1 text-sm ${dateRange === '7d' ? 'bg-gold-500 text-navy-900' : 'text-navy-300'}`}
            >
              7D
            </button>
            <button
              onClick={() => setDateRange('14d')}
              className={`px-3 py-1 text-sm ${dateRange === '14d' ? 'bg-gold-500 text-navy-900' : 'text-navy-300'}`}
            >
              14D
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 text-sm ${dateRange === '30d' ? 'bg-gold-500 text-navy-900' : 'text-navy-300'}`}
            >
              30D
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1 text-sm ${dateRange === '90d' ? 'bg-gold-500 text-navy-900' : 'text-navy-300'}`}
            >
              90D
            </button>
            <button
              onClick={() => setDateRange('180d')}
              className={`px-3 py-1 text-sm ${dateRange === '180d' ? 'bg-gold-500 text-navy-900' : 'text-navy-300'}`}
            >
              180D
            </button>
          </div>
        </div>
        
        <div className="h-80 w-full bg-navy-750 rounded-lg p-4 border border-navy-600 relative">
          {analyticsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          ) : analyticsTrendData && analyticsTrendData.length > 0 ? (
            <Line data={prepareChartData()} options={chartOptions} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-navy-400">
              <BarChart4 className="h-12 w-12 mb-3 opacity-50" />
              <p>No data available for the selected time range</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Moon className="h-5 w-5 text-indigo-400 mr-2" />
            <h4 className="text-white font-medium">Sleep Quality</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-indigo-400">
              {analyticsTrendData && analyticsTrendData.length > 0 
                ? (analyticsTrendData.reduce((sum: number, item: any) => sum + item.sleep, 0) / analyticsTrendData.length).toFixed(1)
                : '-'
              }/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Droplet className="h-5 w-5 text-blue-400 mr-2" />
            <h4 className="text-white font-medium">Water Intake</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-blue-400">
              {analyticsTrendData && analyticsTrendData.length > 0 
                ? (analyticsTrendData.reduce((sum: number, item: any) => sum + item.water, 0) / analyticsTrendData.length).toFixed(1)
                : '-'
              }/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Sun className="h-5 w-5 text-yellow-400 mr-2" />
            <h4 className="text-white font-medium">Energy Level</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-yellow-400">
              {analyticsTrendData && analyticsTrendData.length > 0 
                ? (analyticsTrendData.reduce((sum: number, item: any) => sum + item.energy, 0) / analyticsTrendData.length).toFixed(1)
                : '-'
              }/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Activity className="h-5 w-5 text-green-400 mr-2" />
            <h4 className="text-white font-medium">Overall Wellbeing</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-green-400">
              {analyticsTrendData && analyticsTrendData.length > 0 
                ? (analyticsTrendData.reduce((sum: number, item: any) => sum + item.wellbeing, 0) / analyticsTrendData.length).toFixed(1)
                : '-'
              }/10
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
  
  const renderReminder = () => (
    <div className="bg-navy-750 rounded-lg p-6 border border-gold-500/30 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-gold-500 mr-2" />
          <h3 className="text-xl font-semibold text-white">Wellness Check-in</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-navy-300 hover:text-white"
          >
            &times;
          </button>
        )}
      </div>
      
      <p className="text-navy-300 mb-6">
        It's time for your daily wellness check-in. This helps us track your progress and tailor your healing journey.
      </p>
      
      <div className="flex space-x-3">
        <button
          onClick={() => setShowReminder(false)}
          className="flex-1 bg-gold-500 hover:bg-gold-600 text-navy-900 py-2 px-4 rounded"
        >
          Check in now
        </button>
        <button
          onClick={handleDoLater}
          className="flex-1 bg-navy-700 hover:bg-navy-600 text-white py-2 px-4 rounded"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
  
  const renderForm = () => (
    <div className="bg-navy-750 rounded-lg p-6 border border-navy-600">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gold-500">Wellness Tracker</h2>
        <button 
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              setShowReminder(false);
            }
          }}
          className="text-navy-300 hover:text-white p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {hasSubmittedToday ? (
        <div className="mb-6 p-4 rounded-md bg-navy-700 border border-gold-500/30">
          <div className="flex items-center mb-2">
            <Info className="h-5 w-5 text-gold-500 mr-2" />
            <h3 className="text-gold-500 font-medium">Already Submitted Today</h3>
          </div>
          <p className="text-navy-300">
            You've already recorded your wellness data for today. Come back tomorrow for your next entry.
          </p>
        </div>
      ) : (
        <>
          {renderRatingSlider(
            "Sleep Quality", 
            sleep, 
            setSleep,
            <Moon className="h-5 w-5 text-indigo-400" />
          )}
          
          {renderRatingSlider(
            "Water Intake", 
            water, 
            setWater,
            <Droplet className="h-5 w-5 text-blue-400" />
          )}
          
          {renderRatingSlider(
            "Energy Level", 
            energy, 
            setEnergy,
            <Sun className="h-5 w-5 text-yellow-400" />
          )}
          
          {renderRatingSlider(
            "Overall Wellbeing", 
            wellbeing, 
            setWellbeing,
            <Activity className="h-5 w-5 text-green-400" />
          )}
          
          {submitStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-900/40 text-red-300 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{errorMessage || 'An error occurred'}</span>
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={submitStatus === 'loading'}
            className={`w-full py-3 rounded-md font-medium ${
              submitStatus === 'loading'
                ? 'bg-navy-600 text-navy-300 cursor-not-allowed'
                : submitStatus === 'success'
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-600 text-navy-900'
            }`}
          >
            {submitStatus === 'loading'
              ? 'Saving...'
              : submitStatus === 'success'
              ? 'Saved Successfully!'
              : 'Save Wellness Data'}
          </button>
        </>
      )}
    </div>
  );
  
  const renderAnalytics = () => (
    <div className="mt-6">
      <motion.button
        onClick={handleAnalyticsButtonClick}
        className="w-full py-3 px-4 bg-navy-700 hover:bg-navy-600 text-white rounded-md flex items-center justify-center"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <BarChart4 className="h-5 w-5 mr-2" />
        Analyze Your Wellness Data
      </motion.button>
    </div>
  );
  
  // Function to navigate to packages page
  const handleGoToPackages = () => {
    navigate('/packages');
  };
  
  // Function to render a message for users without an active package
  const renderNoPackageMessage = () => {
    return (
      <div className="bg-navy-800 rounded-lg p-6 border border-navy-700 text-center">
        <div className="flex flex-col items-center mb-6">
          <Package className="w-16 h-16 text-gold-500/60 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Package Required</h3>
          <p className="text-navy-300 max-w-md mx-auto mb-4">
            Access to the Wellness Tracker is exclusive to users with an active healing package. 
            Track your wellbeing metrics and view personalized analytics by upgrading today.
          </p>
          <button
            onClick={handleGoToPackages}
            className="px-4 py-2 bg-gold-500 text-navy-900 rounded-md font-medium hover:bg-gold-400 transition-colors"
          >
            View Available Packages
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="animate-fadeIn">
      {(!user || user.packageType === 'none') ? (
        renderNoPackageMessage()
      ) : showReminder ? (
        renderReminder()
      ) : (
        <div className="relative">
          <AnimatePresence>
            {showAnalytics && renderAnalyticsPanel()}
          </AnimatePresence>
          
          <motion.div
            animate={{ 
              x: showAnalytics ? "-50%" : 0,
              opacity: showAnalytics ? 0.5 : 1,
              scale: showAnalytics ? 0.9 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gold-500 mb-1">Wellness Tracker</h2>
              <p className="text-navy-300">
                Track your daily wellness metrics to monitor your healing progress
              </p>
              
              {lastEntry && (
                <div className="mt-3 text-sm text-navy-400 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Last entry: {new Date(lastEntry.date).toLocaleDateString()} at {new Date(lastEntry.date).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            {renderForm()}
            {history.length > 0 && renderAnalytics()}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WellnessTracker; 