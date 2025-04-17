import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load frequency database
let frequencyDatabase = [];

try {
  const frequencyDataPath = path.join(__dirname, '../../public/AI Data/CAFL_Frequency_Database.json');
  const data = fs.readFileSync(frequencyDataPath, 'utf8');
  frequencyDatabase = JSON.parse(data);
  console.log(`Loaded ${frequencyDatabase.length} frequency entries from database`);
} catch (error) {
  console.error('Error loading frequency database:', error);
}

/**
 * Get recommendations from OpenAI based on health questionnaire
 * @param {Object} healthQuestionnaire - User's health questionnaire data
 * @returns {Promise<Object>} - AI-generated prescription recommendations
 */
export const getAIPrescription = async (healthQuestionnaire) => {
  try {
    console.log('********** AI PRESCRIPTION GENERATION STARTED **********');
    
    // Format the health concerns for better AI context
    const healthConcernsText = healthQuestionnaire.healthConcerns.map(
      concern => `${concern.description} (Type: ${concern.type}, Severity: ${concern.severity}/4)`
    ).join('\n');
    
    // Build a prompt with the questionnaire data
    const prompt = `
As a medical AI specializing in frequency-based healing, analyze this patient's health questionnaire 
and recommend appropriate healing frequencies from the CAFL (Consolidated Annotated Frequency List).

PATIENT INFORMATION:
${healthQuestionnaire.gender ? `Gender: ${healthQuestionnaire.gender}` : ''}
${healthQuestionnaire.age ? `Age: ${healthQuestionnaire.age}` : ''}
${healthQuestionnaire.isPregnant ? 'Patient is pregnant' : ''}

PRIMARY HEALTH CONCERNS:
${healthConcernsText}

${healthQuestionnaire.painLocations && healthQuestionnaire.painLocations.length > 0 ? 
  `Pain Locations: ${healthQuestionnaire.painLocations.join(', ')}${healthQuestionnaire.otherPainLocation ? `, ${healthQuestionnaire.otherPainLocation}` : ''}` : ''}

Emotional State: ${healthQuestionnaire.emotionalState || 'Not specified'}

${healthQuestionnaire.toxinExposure && healthQuestionnaire.toxinExposure.length > 0 ? 
  `Toxin Exposure: ${healthQuestionnaire.toxinExposure.join(', ')}` : ''}

${healthQuestionnaire.lifestyleFactors && healthQuestionnaire.lifestyleFactors.length > 0 ? 
  `Lifestyle Factors: ${healthQuestionnaire.lifestyleFactors.join(', ')}` : ''}

${healthQuestionnaire.healingGoals && healthQuestionnaire.healingGoals.length > 0 ? 
  `Healing Goals: ${healthQuestionnaire.healingGoals.join(', ')}${healthQuestionnaire.otherHealingGoals ? `, ${healthQuestionnaire.otherHealingGoals}` : ''}` : ''}

Based on this patient's health profile, recommend up to 7 specific health conditions from the CAFL database 
that should be addressed, and provide the scientific reasoning for each recommendation.

For each condition, explain:
1. Why this condition is relevant to the patient
2. What frequencies would help and how they work
3. Expected benefits of the treatment

Your response should include ONLY conditions that exist in the CAFL database.
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Using 3.5-turbo to avoid issues with response_format
      messages: [
        { "role": "system", "content": "You are an AI medical specialist working with frequency-based healing." },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    console.log('OpenAI response received');
    
    // Extract recommendations from the text response
    const recommendations = extractRecommendationsFromText(responseContent);
    
    console.log(`Extracted ${recommendations.length} recommendations from AI response`);
    
    // Enhance the recommendations with actual frequencies from the database
    const enhancedRecommendations = await enhanceWithFrequencies(recommendations);
    
    return {
      recommendations: enhancedRecommendations,
      aiResponse: { responseContent }
    };
  } catch (error) {
    console.error('Error generating AI prescription:', error);
    return {
      error: 'Failed to generate AI prescription',
      details: error.message
    };
  }
};

/**
 * Extract recommendations from OpenAI text response
 * @param {string} text - The response text from OpenAI
 * @returns {Array} - Extracted recommendations
 */
function extractRecommendationsFromText(text) {
  // Initialize an array to hold our recommendations
  const recommendations = [];
  
  // Split the text by double newlines to separate sections
  const sections = text.split(/\n\n+/);
  
  // Regular expressions to identify condition sections
  const conditionRegex = /^(\d+\.\s*|Condition\s*\d+:\s*|For\s*|Recommended Condition\s*\d+:\s*)([A-Za-z_\s]+)/i;
  
  // Process each section
  let currentCondition = null;
  let currentReasoning = '';
  let currentBenefits = '';
  
  for (const section of sections) {
    // Check if this section starts a new condition
    const conditionMatch = section.match(conditionRegex);
    
    if (conditionMatch) {
      // If we were processing a condition, save it first
      if (currentCondition) {
        recommendations.push({
          condition: currentCondition,
          reasoning: currentReasoning.trim(),
          benefits: currentBenefits.trim()
        });
      }
      
      // Start a new condition
      currentCondition = conditionMatch[2].trim().replace(/\s+/g, '_');
      currentReasoning = section.replace(conditionRegex, '').trim();
      currentBenefits = '';
    } else if (currentCondition) {
      // Check if this section describes benefits or continues reasoning
      if (section.toLowerCase().includes('benefit') || 
          section.toLowerCase().includes('advantage') || 
          section.toLowerCase().includes('improvement')) {
        currentBenefits = section;
      } else {
        // Add to reasoning if not already captured
        if (!currentReasoning.includes(section)) {
          currentReasoning += '\n\n' + section;
        }
      }
    }
  }
  
  // Add the last condition if there is one
  if (currentCondition) {
    recommendations.push({
      condition: currentCondition,
      reasoning: currentReasoning.trim(),
      benefits: currentBenefits.trim() || "Regular application may provide symptom relief and support overall health improvement."
    });
  }
  
  return recommendations;
}

/**
 * Enhance AI recommendations with frequencies from the database
 * @param {Array} recommendations 
 * @returns {Array} Enhanced recommendations with frequencies
 */
const enhanceWithFrequencies = async (recommendations) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }

  // Limit to maximum 5 conditions (user experience improvement)
  const limitedRecommendations = recommendations.slice(0, 5);

  return limitedRecommendations.map(recommendation => {
    // Find matching condition in the frequency database
    const matchingConditions = frequencyDatabase.filter(entry => {
      const normalizedEntry = entry.Condition.toLowerCase().replace(/_/g, ' ');
      const normalizedRecommendation = recommendation.condition.toLowerCase().replace(/_/g, ' ');
      
      // Try different matching approaches
      return (
        // Exact match
        normalizedEntry === normalizedRecommendation ||
        // Partial match (condition is part of the database entry)
        normalizedEntry.includes(normalizedRecommendation) ||
        // Words in different order - look for key terms
        normalizedRecommendation.split(' ').some(word => 
          word.length > 3 && normalizedEntry.includes(word)
        )
      );
    });

    // Sort matches by relevance - prefer exact matches
    matchingConditions.sort((a, b) => {
      const aMatch = a.Condition.toLowerCase().replace(/_/g, ' ');
      const bMatch = b.Condition.toLowerCase().replace(/_/g, ' ');
      const normalizedRecommendation = recommendation.condition.toLowerCase().replace(/_/g, ' ');
      
      // Prefer exact matches
      if (aMatch === normalizedRecommendation) return -1;
      if (bMatch === normalizedRecommendation) return 1;
      
      // Then prefer partial matches
      return aMatch.indexOf(normalizedRecommendation) - bMatch.indexOf(normalizedRecommendation);
    });

    // Get best match and its frequencies
    const bestMatch = matchingConditions.length > 0 ? matchingConditions[0] : null;
    
    // Use all frequencies if available
    let selectedFrequencies = [];
    if (bestMatch && bestMatch.Frequencies && Array.isArray(bestMatch.Frequencies) && bestMatch.Frequencies.length > 0) {
      // Validate and filter to numeric frequencies
      const numericFreqs = bestMatch.Frequencies
        .filter(f => f && !isNaN(parseFloat(f)))
        .map(f => parseFloat(f));
      
      // Ensure we have valid frequencies (in a reasonable range)
      // Therapeutic frequencies usually range from 1Hz to 20000Hz
      const validFreqs = numericFreqs.filter(f => f > 0 && f <= 20000);
      
      // Use all valid frequencies - NO LIMIT
      selectedFrequencies = validFreqs.map(f => f.toString());
      
      // Ensure array is not empty, if it is, supply a default frequency
      if (selectedFrequencies.length === 0) {
        // Add a safe default frequency (528 Hz is a common healing frequency)
        selectedFrequencies = ["528"];
        console.log(`No valid frequencies found for condition ${recommendation.condition}, using default 528 Hz`);
      }
    } else {
      // No frequencies found, use a default
      selectedFrequencies = ["528"];
      console.log(`No frequency data found for condition ${recommendation.condition}, using default 528 Hz`);
    }
    
    const frequencies = selectedFrequencies;
    const conditionName = bestMatch ? bestMatch.Condition : recommendation.condition;

    console.log(`Selected ${frequencies.length} frequencies for condition "${conditionName}"`);
    
    return {
      ...recommendation,
      condition: conditionName,
      frequencies: frequencies,
      matched: Boolean(bestMatch)
    };
  });
};

export default {
  getAIPrescription
}; 