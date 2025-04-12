import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Wellness Entry Schema
 * Stores individual wellness entries for users
 */
const WellnessEntrySchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  sleep: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  water: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  wellbeing: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
}, {
  timestamps: true,
});

// Index to optimize queries by user and date
WellnessEntrySchema.index({ user: 1, date: -1 });

// Method to get summary statistics for a user
WellnessEntrySchema.statics.getUserStats = async function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { 
      $group: {
        _id: null,
        avgSleep: { $avg: "$sleep" },
        avgWater: { $avg: "$water" },
        avgEnergy: { $avg: "$energy" },
        avgWellbeing: { $avg: "$wellbeing" },
        entryCount: { $sum: 1 },
        firstEntry: { $min: "$date" },
        lastEntry: { $max: "$date" },
      }
    }
  ]);
};

// Method to check if a user needs a reminder
WellnessEntrySchema.statics.shouldPromptUser = async function(userId) {
  // Find the most recent entry for the user
  const latestEntry = await this.findOne(
    { user: userId },
    {},
    { sort: { date: -1 } }
  );
  
  if (!latestEntry) {
    // User has no entries, should be prompted
    return true;
  }
  
  // Calculate time difference in hours
  const now = new Date();
  const lastEntryTime = new Date(latestEntry.date);
  const hoursSinceLastEntry = (now - lastEntryTime) / (1000 * 60 * 60);
  
  // If it's been more than 24 hours, prompt the user
  return hoursSinceLastEntry >= 24;
};

// Method to get weekly trend data for a user
WellnessEntrySchema.statics.getWeeklyTrend = async function(userId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.aggregate([
    { 
      $match: { 
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        sleep: { $avg: "$sleep" },
        water: { $avg: "$water" },
        energy: { $avg: "$energy" },
        wellbeing: { $avg: "$wellbeing" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Create the model
const WellnessEntry = mongoose.model('WellnessEntry', WellnessEntrySchema);

export default WellnessEntry; 