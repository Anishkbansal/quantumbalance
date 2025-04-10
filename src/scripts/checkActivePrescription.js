import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Prescription from '../models/Prescription.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find users with active prescriptions
      const users = await User.find({ activePrescriptionId: { $exists: true, $ne: null } });
      console.log(`Found ${users.length} users with active prescriptions`);
      
      for (const user of users) {
        console.log(`\nChecking user: ${user.name} (${user.email})`);
        
        // Find the active prescription
        const prescription = await Prescription.findById(user.activePrescriptionId);
        
        if (!prescription) {
          console.log(`No active prescription found for user ID: ${user._id}`);
          continue;
        }
        
        console.log(`Prescription ID: ${prescription._id}`);
        console.log(`Frequencies count: ${prescription.frequencies?.length || 0}`);
        
        // Check frequency structure
        if (prescription.frequencies && prescription.frequencies.length > 0) {
          const firstFreq = prescription.frequencies[0];
          console.log(`First frequency value type: ${typeof firstFreq.value}`);
          console.log(`First frequency value: ${JSON.stringify(firstFreq.value)}`);
          console.log(`First frequency has order: ${firstFreq.order !== undefined}`);
          console.log(`First frequency has audioId: ${firstFreq.audioId !== undefined}`);
        } else {
          console.log('No frequencies found in this prescription');
        }
      }
      
      console.log('\nDone checking active prescriptions');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 