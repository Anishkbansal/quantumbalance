import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find the most recent prescription
      const latestPrescription = await Prescription.findOne().sort({ createdAt: -1 });
      
      if (!latestPrescription) {
        console.log('No prescriptions found in the database.');
        mongoose.disconnect();
        return;
      }
      
      console.log('\n********** PRESCRIPTION VERIFICATION **********');
      console.log(`Prescription ID: ${latestPrescription._id}`);
      console.log(`Created: ${latestPrescription.createdAt}`);
      console.log(`Title: ${latestPrescription.title}`);
      console.log(`Description: ${latestPrescription.description}`);
      console.log(`Timing: ${latestPrescription.timing}`);
      console.log(`Status: ${latestPrescription.status}`);
      
      // Find the associated user
      const user = await User.findById(latestPrescription.userId);
      if (user) {
        console.log(`User: ${user.name} (${user.email})`);
        
        // Check if user has a reference to this prescription
        if (user.activePrescriptionId) {
          const activePrescriptionId = user.activePrescriptionId.toString();
          const latestPrescriptionId = latestPrescription._id.toString();
          
          console.log(`User's active prescription ID: ${activePrescriptionId}`);
          console.log(`Reference match: ${activePrescriptionId === latestPrescriptionId ? 'YES' : 'NO'}`);
        } else {
          console.log('User does not have an active prescription reference.');
        }
      } else {
        console.log(`User ID: ${latestPrescription.userId} (user not found)`);
      }
      
      // Print frequencies
      console.log('\nFrequencies:');
      if (latestPrescription.frequencies && latestPrescription.frequencies.length > 0) {
        latestPrescription.frequencies.forEach((freq, index) => {
          console.log(`\n[${index + 1}] ${freq.purpose}`);
          console.log(`Frequency values: ${freq.value}`);
        });
        
        console.log(`\nTotal frequencies: ${latestPrescription.frequencies.length}`);
      } else {
        console.log('No frequencies found in this prescription.');
      }
      
      console.log('\n********** VERIFICATION COMPLETE **********');
      console.log('Prescription data structure is valid.');
      
    } catch (error) {
      console.error('Error verifying prescription:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 