import WellnessEntry from '../models/WellnessEntry.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import UserPackage from '../models/UserPackage.js';

/**
 * Submit a new wellness entry
 * POST /api/wellness
 */
export const createWellnessEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sleep, water, energy, wellbeing, date } = req.body;
    
    // Basic validation
    if (
      !sleep || !water || !energy || !wellbeing ||
      sleep < 1 || sleep > 10 ||
      water < 1 || water > 10 ||
      energy < 1 || energy > 10 ||
      wellbeing < 1 || wellbeing > 10
    ) {
      return res.status(400).json({
        success: false,
        message: 'All wellness metrics must be provided and be between 1 and 10',
      });
    }
    
    // Verify user has an active package
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(403).json({
        success: false,
        message: 'Active package required to submit wellness data',
      });
    }
    
    // Verify package is not expired
    const isPackageExpired = await user.isPackageExpired();
    if (isPackageExpired) {
      return res.status(403).json({
        success: false,
        message: 'Your package has expired',
      });
    }
    
    // Create and save the wellness entry
    const wellnessData = {
      user: userId,
      sleep,
      water,
      energy,
      wellbeing,
      date: date || new Date()
    };
    
    console.log('Before saving wellness data:', wellnessData);
    
    const wellnessEntry = new WellnessEntry(wellnessData);
    await wellnessEntry.save();
    
    // Add wellness entry ID to user's wellnessEntries array
    await User.findByIdAndUpdate(
      userId,
      { $push: { wellnessEntries: wellnessEntry._id } }
    );
    
    // Get saved entry for logging
    const savedEntry = await WellnessEntry.findById(wellnessEntry._id)
      .populate('user', 'name email');
    
    console.log('After saving wellness data:', savedEntry);
    
    return res.status(201).json({
      success: true,
      message: 'Wellness entry saved successfully',
      entry: wellnessEntry,
    });
  } catch (error) {
    console.error('Error submitting wellness entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get wellness history for a user
 * GET /api/wellness/history
 */
export const getWellnessHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all entries for the user, sorted by date (newest first)
    const entries = await WellnessEntry.find({ user: userId })
      .sort({ date: -1 })
      .lean();
    
    return res.status(200).json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error('Error fetching wellness history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Check if user should be prompted for wellness data
 * GET /api/wellness/reminder
 */
export const getWellnessReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has an active non-admin package
    const user = await User.findById(userId);
    if (!user || user.isAdmin || user.packageType === 'none' || !user.activePackageId) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false,
        message: 'User not eligible for wellness prompts',
      });
    }
    
    // Check if package is expired
    const isPackageExpired = await user.isPackageExpired();
    if (isPackageExpired) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false, 
        message: 'Package expired',
      });
    }
    
    // Check if user has questionnaire
    if (!user.healthQuestionnaire) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false,
        message: 'User has not completed health questionnaire',
      });
    }
    
    // Check if it's been more than 24 hours since last entry
    // Find the most recent entry for the user
    const latestEntry = await WellnessEntry.findOne(
      { user: userId },
      {},
      { sort: { date: -1 } }
    );
    
    let shouldPrompt = true;
    
    if (latestEntry) {
      // Calculate time difference in hours
      const now = new Date();
      const lastEntryTime = new Date(latestEntry.date);
      const hoursSinceLastEntry = (now - lastEntryTime) / (1000 * 60 * 60);
      
      // If it's been less than 24 hours, don't prompt the user
      shouldPrompt = hoursSinceLastEntry >= 24;
    }
    
    return res.status(200).json({
      success: true,
      shouldPrompt,
      lastEntry: latestEntry,
      message: shouldPrompt ? 'User should be prompted for wellness data' : 'User has recent wellness data',
    });
  } catch (error) {
    console.error('Error checking last wellness entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get wellness statistics for a user
 * GET /api/wellness/stats
 */
export const getWellnessStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get date range from query params (default to 30d if not provided)
    const range = req.query.range || '30d';
    
    // Calculate date range based on parameter
    const endDate = new Date(); // now
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '14d':
        startDate.setDate(startDate.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '180d':
        startDate.setDate(startDate.getDate() - 180);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }
    
    // Get user's wellness statistics
    const statsResults = await WellnessEntry.getUserStats(userId, startDate, endDate);
    const stats = statsResults.length > 0 ? statsResults[0] : null;
    
    // Get trend data for the selected date range
    const trendData = await WellnessEntry.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .lean();
    
    // Group data by day for the trend chart
    const groupedByDay = {};
    
    trendData.forEach(entry => {
      const date = new Date(entry.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = {
          count: 0,
          sleep: 0,
          water: 0,
          energy: 0,
          wellbeing: 0
        };
      }
      
      groupedByDay[dateKey].count += 1;
      groupedByDay[dateKey].sleep += entry.sleep;
      groupedByDay[dateKey].water += entry.water;
      groupedByDay[dateKey].energy += entry.energy;
      groupedByDay[dateKey].wellbeing += entry.wellbeing;
    });
    
    // Calculate averages for each day
    const weeklyTrend = Object.keys(groupedByDay).map(dateKey => {
      const day = groupedByDay[dateKey];
      return {
        _id: dateKey,
        sleep: day.sleep / day.count,
        water: day.water / day.count,
        energy: day.energy / day.count,
        wellbeing: day.wellbeing / day.count,
        count: day.count
      };
    });
    
    return res.status(200).json({
      success: true,
      stats,
      weeklyTrend,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching wellness stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}; 