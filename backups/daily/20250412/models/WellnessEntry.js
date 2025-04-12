import mongoose from 'mongoose';

const WellnessEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  sleep: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  water: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  wellbeing: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, { timestamps: true });

/**
 * Get user statistics for wellness entries
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for the query range
 * @param {Date} endDate - End date for the query range
 */
WellnessEntrySchema.statics.getUserStats = function(userId, startDate, endDate) {
  return this.aggregate([
    { 
      $match: { 
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      } 
    },
    { 
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        avgSleep: { $avg: "$sleep" },
        avgWater: { $avg: "$water" },
        avgEnergy: { $avg: "$energy" },
        avgWellbeing: { $avg: "$wellbeing" },
        firstEntry: { $min: "$date" },
        lastEntry: { $max: "$date" }
      } 
    },
    {
      $project: {
        _id: 0,
        totalEntries: 1,
        avgSleep: { $round: ["$avgSleep", 1] },
        avgWater: { $round: ["$avgWater", 1] },
        avgEnergy: { $round: ["$avgEnergy", 1] },
        avgWellbeing: { $round: ["$avgWellbeing", 1] },
        firstEntry: 1,
        lastEntry: 1,
        daysTracked: {
          $round: [
            { 
              $divide: [
                { $subtract: ["$lastEntry", "$firstEntry"] }, 
                1000 * 60 * 60 * 24 
              ] 
            },
            0
          ]
        }
      }
    }
  ]);
};

/**
 * Get weekly trend for a user
 * @param {string} userId - User ID
 */
WellnessEntrySchema.statics.getWeeklyTrend = function(userId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 30); // Get data for the last 30 days
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" }
        },
        sleep: { $avg: "$sleep" },
        water: { $avg: "$water" },
        energy: { $avg: "$energy" },
        wellbeing: { $avg: "$wellbeing" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 1,
        sleep: { $round: ["$sleep", 1] },
        water: { $round: ["$water", 1] },
        energy: { $round: ["$energy", 1] },
        wellbeing: { $round: ["$wellbeing", 1] },
        count: 1
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

const WellnessEntry = mongoose.model('WellnessEntry', WellnessEntrySchema);

export default WellnessEntry; 