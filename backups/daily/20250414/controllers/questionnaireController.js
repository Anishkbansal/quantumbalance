import User from '../models/User.js';
import HealthQuestionnaire from '../models/HealthQuestionnaire.js';
import { generateAIPrescription } from '../utils/prescriptionService.js';

// Save a user's health questionnaire
export const saveQuestionnaire = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Validate request data
    if (!req.body.healthConcerns || !req.body.healthConcerns.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one health concern is required'
      });
    }
    
    if (!req.body.emotionalState) {
      return res.status(400).json({
        success: false,
        message: 'Emotional state is required'
      });
    }
    
    // Filter out empty health concerns
    const validHealthConcerns = req.body.healthConcerns.filter(
      concern => concern.description && concern.description.trim() !== ''
    );
    
    if (validHealthConcerns.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid health concern is required'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create the questionnaire object with cleaned data
    const questionnaire = {
      isPregnant: req.body.isPregnant === 'true' || req.body.isPregnant === true,
      healthConcerns: validHealthConcerns,
      painLocations: req.body.painLocations || [],
      otherPainLocation: req.body.otherPainLocation || '',
      emotionalState: req.body.emotionalState,
      toxinExposure: req.body.toxinExposure || [],
      lifestyleFactors: req.body.lifestyleFactors || [],
      healingGoals: req.body.healingGoals || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update the user's questionnaire
    user.healthQuestionnaire = questionnaire;
    
    // If package information was provided, store it with the questionnaire
    if (req.body.packageId || req.body.packageType) {
      user.healthQuestionnaire.selectedPackage = {
        packageId: req.body.packageId || null,
        packageType: req.body.packageType || 'none'
      };
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Health questionnaire saved successfully',
      data: {
        user: {
          _id: user._id,
          healthQuestionnaire: user.healthQuestionnaire
        }
      }
    });
  } catch (error) {
    console.error('Error saving questionnaire:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving health questionnaire',
      error: error.message
    });
  }
};

// Get a user's health questionnaire
export const getQuestionnaire = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user and select only the questionnaire field
    const user = await User.findById(userId).select('healthQuestionnaire');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user has a questionnaire
    if (!user.healthQuestionnaire) {
      return res.status(404).json({
        success: false,
        message: 'No health questionnaire found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        questionnaire: user.healthQuestionnaire
      }
    });
  } catch (error) {
    console.error('Error retrieving questionnaire:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving health questionnaire',
      error: error.message
    });
  }
};

// Update a user's health questionnaire
export const updateQuestionnaire = async (req, res) => {
  try {
    const userId = req.user._id;
    const { keepExisting } = req.query;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has an existing questionnaire
    if (!user.healthQuestionnaire) {
      return res.status(404).json({
        success: false,
        message: 'No existing questionnaire found. Please create one first.'
      });
    }
    
    // Get the existing data
    const existingQuestionnaire = user.healthQuestionnaire;
    
    // If keepExisting is true (client chose to keep all existing data),
    // skip the update and return the existing data
    if (keepExisting === 'true') {
      return res.status(200).json({
        success: true,
        message: 'Keeping existing questionnaire data as requested',
        data: {
          user: {
            _id: user._id,
            healthQuestionnaire: existingQuestionnaire
          }
        }
      });
    }
    
    // If keepExisting is true for specific fields, maintain those values
    const updatedQuestionnaire = {
      isPregnant: req.body.keepPregnancy ? existingQuestionnaire.isPregnant : 
                  (req.body.isPregnant === 'true' || req.body.isPregnant === true),
      
      healthConcerns: req.body.keepHealthConcerns ? existingQuestionnaire.healthConcerns : 
                     (req.body.healthConcerns ? req.body.healthConcerns.filter(
                        concern => concern.description && concern.description.trim() !== ''
                      ) : existingQuestionnaire.healthConcerns),
      
      painLocations: req.body.keepPainLocations ? existingQuestionnaire.painLocations :
                    (req.body.painLocations || existingQuestionnaire.painLocations),
      
      otherPainLocation: req.body.keepOtherPainLocation ? existingQuestionnaire.otherPainLocation :
                         (req.body.otherPainLocation || existingQuestionnaire.otherPainLocation || ''),
      
      emotionalState: req.body.keepEmotionalState ? existingQuestionnaire.emotionalState :
                     (req.body.emotionalState || existingQuestionnaire.emotionalState),
      
      toxinExposure: req.body.keepToxinExposure ? existingQuestionnaire.toxinExposure :
                    (req.body.toxinExposure || existingQuestionnaire.toxinExposure || []),
      
      lifestyleFactors: req.body.keepLifestyleFactors ? existingQuestionnaire.lifestyleFactors :
                       (req.body.lifestyleFactors || existingQuestionnaire.lifestyleFactors || []),
      
      healingGoals: req.body.keepHealingGoals ? existingQuestionnaire.healingGoals :
                   (req.body.healingGoals || existingQuestionnaire.healingGoals || []),
      
      // Keep creation date but update the updated date
      createdAt: existingQuestionnaire.createdAt,
      updatedAt: new Date()
    };
    
    // Check if selectedPackage exists and should be preserved
    if (existingQuestionnaire.selectedPackage && !req.body.selectedPackage) {
      updatedQuestionnaire.selectedPackage = existingQuestionnaire.selectedPackage;
    } else if (req.body.selectedPackage) {
      updatedQuestionnaire.selectedPackage = req.body.selectedPackage;
    }
    
    // Update the user's questionnaire with the merged data
    user.healthQuestionnaire = updatedQuestionnaire;
    await user.save();
    
    console.log(`Health questionnaire updated for user ${userId}`);
    
    // Generate a new prescription if user has an active package or this is a renewal
    let prescriptionResult = null;
    const isRenewal = req.query.isRenewal === 'true' || req.body.isRenewal === true;
    
    // Always generate a prescription after questionnaire update if user has an active package
    if ((user.packageType !== 'none' && user.activePackageId) || isRenewal) {
      try {
        console.log(`Generating AI prescription after questionnaire update for user ${userId}...`);
        prescriptionResult = await generateAIPrescription(userId);
        
        if (prescriptionResult.success) {
          console.log(`********** AI PRESCRIPTION GENERATED AFTER QUESTIONNAIRE UPDATE **********`);
          console.log(`Generated prescription ID: ${prescriptionResult.prescription._id}`);
          console.log(`For user: ${userId}`);
          console.log(`Package type: ${user.packageType}`);
          console.log(`Number of frequencies: ${prescriptionResult.prescription.frequencies.length}`);
        } else {
          console.error(`Failed to generate AI prescription after questionnaire update for user ${userId}:`, prescriptionResult.message);
        }
      } catch (prescriptionError) {
        console.error(`Error generating AI prescription after questionnaire update for user ${userId}:`, prescriptionError);
      }
    } else {
      console.log(`User ${userId} has no active package. No AI prescription generated.`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Health questionnaire updated successfully',
      data: {
        user: {
          _id: user._id,
          healthQuestionnaire: user.healthQuestionnaire
        },
        prescription: prescriptionResult?.success ? {
          generated: true,
          id: prescriptionResult.prescription._id
        } : {
          generated: false
        }
      }
    });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating health questionnaire',
      error: error.message
    });
  }
};

// Save questionnaire history - keeps track of changes over time
export const saveQuestionnaireHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get the current questionnaire
    const user = await User.findById(userId).select('healthQuestionnaire');
    
    if (!user || !user.healthQuestionnaire) {
      return res.status(404).json({
        success: false,
        message: 'No questionnaire found'
      });
    }
    
    // Create a new HealthQuestionnaire document (historical snapshot)
    const questionnaire = new HealthQuestionnaire({
      userId: userId,
      isPregnant: user.healthQuestionnaire.isPregnant,
      age: req.body.age || user.healthQuestionnaire.age,
      gender: req.body.gender || user.healthQuestionnaire.gender,
      height: req.body.height || user.healthQuestionnaire.height,
      weight: req.body.weight || user.healthQuestionnaire.weight,
      healthConcerns: user.healthQuestionnaire.healthConcerns,
      painLocations: user.healthQuestionnaire.painLocations,
      emotionalWellbeing: user.healthQuestionnaire.emotionalState 
        ? [{ state: user.healthQuestionnaire.emotionalState, severity: 3 }] 
        : [],
      environmentalFactors: user.healthQuestionnaire.toxinExposure || [],
      healingGoals: user.healthQuestionnaire.healingGoals
    });
    
    await questionnaire.save();
    
    return res.status(201).json({
      success: true,
      message: 'Questionnaire history saved successfully',
      data: questionnaire
    });
  } catch (error) {
    console.error('Error saving questionnaire history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving questionnaire history',
      error: error.message
    });
  }
}; 