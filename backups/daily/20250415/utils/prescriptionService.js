import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import { getAIPrescription } from './aiPrescriptionService.js';

/**
 * Generate an AI prescription for a user based on their health questionnaire
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The generated prescription or error
 */
export const generateAIPrescription = async (userId) => {
  try {
    // Find the user with their health questionnaire and package type
    const user = await User.findById(userId).select('healthQuestionnaire packageType');
    
    if (!user) {
      console.error(`User ${userId} not found`);
      return { success: false, message: 'User not found' };
    }
    
    if (!user.healthQuestionnaire) {
      console.error(`User ${userId} has no health questionnaire`);
      return { success: false, message: 'User has no health questionnaire' };
    }
    
    // Get recommendations from AI prescription service
    const prescriptionData = await getAIPrescription(user.healthQuestionnaire);
    
    if (prescriptionData.error) {
      console.error(`Error generating AI prescription for user ${userId}:`, prescriptionData.error);
      return { success: false, message: prescriptionData.error };
    }
    
    // Log the prescription details with special marker for testing
    console.log('********** AI PRESCRIPTION DETAILS **********');
    console.log('User ID:', userId);
    console.log('Package Type:', user.packageType);
    console.log('Recommendations:', JSON.stringify(prescriptionData.recommendations, null, 2));
    
    // Group recommendations by condition and limit to exactly 1 frequency per condition
    const groupedRecommendations = {};
    
    // First, group by condition and select only the most appropriate frequency for each
    prescriptionData.recommendations
      .filter(r => r.matched && r.frequencies && r.frequencies.length > 0)
      .forEach(recommendation => {
        // Extract condition name without underscores
        const conditionName = recommendation.condition.replace(/_/g, ' ');
        
        // Initialize the condition group if it doesn't exist
        if (!groupedRecommendations[conditionName]) {
          groupedRecommendations[conditionName] = {
            condition: conditionName,
            frequencies: []
          };
        }
        
        // Create a clean, professional-looking purpose text
        const relevanceText = recommendation.reasoning.split('\n')[0].trim();
        const cleanRelevance = relevanceText.length > 100 
          ? relevanceText.substring(0, 100) + '...' 
          : relevanceText;
        
        // Create a complete purpose that mentions all frequencies
        const purpose = `For ${conditionName}: - Relevance: ${cleanRelevance} - Frequencies: ${recommendation.frequencies.join(', ')} Hz - How it works: These frequencies are believed to help with ${conditionName.toLowerCase()}.`;
        
        // Add to frequencies array with all frequencies for this condition
        groupedRecommendations[conditionName].frequencies.push({
          value: recommendation.frequencies, // Store all frequencies as an array
          purpose: purpose,
          order: 0
        });
      });
    
    // Determine number of conditions based on package type
    let maxConditions = 3; // Default for enhanced/premium packages
    
    if (user.packageType === 'single') {
      maxConditions = 2;
    } else if (user.packageType === 'basic') {
      maxConditions = 1;
    }
    
    console.log(`Setting max conditions to ${maxConditions} based on package type ${user.packageType}`);
    
    // Limit conditions based on package type
    const limitedConditions = Object.keys(groupedRecommendations).slice(0, maxConditions);
    
    // Convert grouped recommendations to the format needed for the prescription
    const frequencies = limitedConditions.flatMap(conditionName => {
      const group = groupedRecommendations[conditionName];
      return group.frequencies.map(freq => ({
        value: freq.value,
        purpose: freq.purpose,
        condition: group.condition,
        order: freq.order
      }));
    });
    
    // Create a new prescription in the database
    const prescription = new Prescription({
      userId: userId,
      title: 'AI-Generated Health Frequency Prescription',
      description: 'Prescription generated based on your health questionnaire',
      frequencies: frequencies,
      timing: 'Daily for 2 weeks, 3 sessions per day, 3 minutes per frequency',
      condition: limitedConditions.join(', '), // Store all conditions in the condition field
      status: 'active'
    });
    
    await prescription.save();
    console.log(`Prescription saved to database with ID: ${prescription._id}`);
    console.log(`Generated ${frequencies.length} frequencies across ${limitedConditions.length} conditions`);
    
    // Update user with reference to the new prescription
    await User.findByIdAndUpdate(userId, {
      activePrescriptionId: prescription._id
    });
    console.log(`Updated user ${userId} with reference to prescription ${prescription._id}`);
    
    return {
      success: true,
      message: 'AI prescription generated successfully',
      prescription: prescription,
      aiRecommendations: prescriptionData.recommendations
    };
  } catch (error) {
    console.error(`Error in generateAIPrescription for user ${userId}:`, error);
    return {
      success: false,
      message: 'Error generating AI prescription',
      error: error.message
    };
  }
};

export default {
  generateAIPrescription
}; 