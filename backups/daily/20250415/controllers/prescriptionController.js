import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { generateAIPrescription } from '../utils/prescriptionService.js';

// Get the user's active prescription
export const getActivePrescription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Add debug logging
    console.log(`Fetching active prescription for user ${userId}`);
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has an active prescription reference
    if (!user.activePrescriptionId) {
      console.log(`No activePrescriptionId found for user ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'No active prescription found',
        hasQuestionnaire: !!user.healthQuestionnaire
      });
    }
    
    console.log(`Found activePrescriptionId ${user.activePrescriptionId} for user ${userId}`);
    
    // Get the active prescription - without populate first to ensure it exists
    const prescription = await Prescription.findById(user.activePrescriptionId);
      
    if (!prescription) {
      console.log(`Prescription with ID ${user.activePrescriptionId} not found in database`);
      return res.status(404).json({
        success: false,
        message: 'Active prescription not found in database',
        hasQuestionnaire: !!user.healthQuestionnaire
      });
    }
    
    // Convert any object IDs in frequencies to ensure we can safely access their properties
    // This helps avoid errors if the data structure is unexpected
    const safeFrequencies = prescription.frequencies?.map(freq => {
      const safeFreq = {
        ...freq.toObject(),
        _id: freq._id.toString()
      };
      if (safeFreq.audioId) {
        // Convert audioId to string if it exists
        safeFreq.audioId = freq.audioId.toString();
      }
      return safeFreq;
    });
    
    // Create a safe version of the prescription to return
    const safePrescription = {
      ...prescription.toObject(),
      _id: prescription._id.toString(),
      frequencies: safeFrequencies
    };
    
    console.log(`Successfully fetched prescription for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      prescription: safePrescription
    });
  } catch (error) {
    console.error('Error fetching active prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active prescription',
      error: error.message
    });
  }
};

// Get all prescriptions for the user
export const getAllPrescriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all prescriptions for this user
    const prescriptions = await Prescription.find({ userId }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

// Generate a new prescription
export const generatePrescription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has an active package
    if (user.packageType === 'none' || !user.activePackageId) {
      return res.status(403).json({
        success: false,
        message: 'You need an active package to generate a prescription'
      });
    }
    
    // Check if user has a health questionnaire
    if (!user.healthQuestionnaire) {
      return res.status(400).json({
        success: false,
        message: 'You need to fill out a health questionnaire first'
      });
    }
    
    // Generate the prescription
    const result = await generateAIPrescription(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to generate prescription'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Prescription generated successfully',
      prescription: result.prescription
    });
  } catch (error) {
    console.error('Error generating prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating prescription',
      error: error.message
    });
  }
};

// Migrate existing prescriptions to the new schema
export const migratePrescriptions = async (req, res) => {
  try {
    // Only allow admins to perform migration
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can migrate prescriptions'
      });
    }
    
    // Find all prescriptions
    const prescriptions = await Prescription.find({});
    let migratedCount = 0;
    let errorCount = 0;
    
    // Update each prescription
    for (const prescription of prescriptions) {
      try {
        // Check if frequencies exist and iterate through them
        if (prescription.frequencies && Array.isArray(prescription.frequencies)) {
          let hasChanges = false;
          
          // Update each frequency
          for (const freq of prescription.frequencies) {
            // Convert value to array if it's a string
            if (typeof freq.value === 'string') {
              freq.value = freq.value.split(',').map(v => v.trim());
              hasChanges = true;
            }
            
            // Ensure order exists
            if (freq.order === undefined) {
              freq.order = 0;
              hasChanges = true;
            }
          }
          
          // Save the prescription if changes were made
          if (hasChanges) {
            await prescription.save();
            migratedCount++;
          }
        }
      } catch (err) {
        console.error(`Error migrating prescription ${prescription._id}:`, err);
        errorCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Migration completed. ${migratedCount} prescriptions updated, ${errorCount} errors.`
    });
  } catch (error) {
    console.error('Error migrating prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error migrating prescriptions',
      error: error.message
    });
  }
};

// Add a new function to get basic prescription data
export const getBasicPrescriptionData = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    
    // Find the prescription by ID
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Return only the necessary data for checking audio links
    return res.status(200).json({
      success: true,
      frequencies: prescription.frequencies.map(freq => ({
        _id: freq._id,
        condition: freq.condition,
        audioId: freq.audioId
      }))
    });
  } catch (error) {
    console.error('Error fetching basic prescription data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching prescription data',
      error: error.message
    });
  }
};
