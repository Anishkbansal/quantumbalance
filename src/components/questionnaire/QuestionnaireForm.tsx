import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, Edit, Save } from 'lucide-react';
import { QuestionnaireData } from '../../types/questionnaire';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionnaireFormProps {
  onSubmit: (data: QuestionnaireData, keepOptions?: Record<string, boolean>) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  hasExistingQuestionnaire?: boolean;
  defaultData?: QuestionnaireData | null;
  isEditing?: boolean;
  onGoBack?: () => void;
  disabled?: boolean;
}

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  error,
  hasExistingQuestionnaire,
  defaultData,
  isEditing = false,
  onGoBack,
  disabled
}) => {
  const [activeSection, setActiveSection] = useState<string>('pregnancy');
  const [keepOptions, setKeepOptions] = useState<Record<string, boolean>>({
    keepPregnancy: false,
    keepHealthConcerns: false,
    keepPainLocations: false,
    keepOtherPainLocation: false,
    keepEmotionalState: false,
    keepToxinExposure: false,
    keepLifestyleFactors: false,
    keepHealingGoals: false
  });

  const { register, handleSubmit, formState: { errors } } = useForm<QuestionnaireData>({
    defaultValues: {
      healthConcerns: [{}, {}, {}] as any[],
      ...(defaultData || {})
    }
  });

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const toggleKeepExisting = (field: string) => {
    if (hasExistingQuestionnaire) {
      setKeepOptions(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
  };

  const handleFormSubmit = (data: QuestionnaireData) => {
    onSubmit(data, keepOptions);
  };

  const renderSectionTitle = (
    title: string, 
    section: string, 
    keepField?: string,
    infoText?: string
  ) => (
    <div 
      className={`flex items-center justify-between p-4 rounded-t-md cursor-pointer
        ${activeSection === section 
          ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white' 
          : 'bg-navy-700 text-white hover:bg-navy-600'}`}
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {infoText && (
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-300" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-navy-900 p-2 rounded shadow-lg text-xs text-gray-300 z-10">
              {infoText}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {hasExistingQuestionnaire && keepField && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleKeepExisting(keepField);
            }}
            className={`flex items-center gap-1 text-xs rounded px-2 py-1 ${
              keepOptions[keepField] 
                ? 'bg-green-700 text-white' 
                : 'bg-navy-600 text-gray-300'
            }`}
          >
            {keepOptions[keepField] ? <CheckCircle className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
            {keepOptions[keepField] ? 'Keep Existing' : 'Update'}
          </button>
        )}
        {activeSection === section ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {hasExistingQuestionnaire && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-md bg-navy-700 border border-gold-500/30 text-white flex items-center gap-2"
        >
          <Info className="w-5 h-5 text-gold-500" />
          <div className="flex-1">
            <h3 className="font-medium">Update Your Health Questionnaire</h3>
            <p className="text-sm text-gray-300">You can choose to keep existing answers or update them section by section.</p>
          </div>
        </motion.div>
      )}

      {/* Pregnancy Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle('Pregnancy Status', 'pregnancy', 'keepPregnancy')}
        
        <AnimatePresence>
          {activeSection === 'pregnancy' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <div className={keepOptions.keepPregnancy ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm text-gray-300">
                    Are you currently pregnant?
                  </label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="true"
                        disabled={disabled || keepOptions.keepPregnancy}
                        {...register("isPregnant", { required: "Please select one option" })}
                        className="text-gold-500 focus:ring-gold-500 h-4 w-4"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="false"
                        disabled={disabled || keepOptions.keepPregnancy}
                        {...register("isPregnant", { required: "Please select one option" })}
                        className="text-gold-500 focus:ring-gold-500 h-4 w-4"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {errors.isPregnant && 
                    <p className="text-red-400 text-sm mt-1">{errors.isPregnant.message}</p>
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Health Concerns Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle(
          'Health Concerns', 
          'health', 
          'keepHealthConcerns',
          'Please list your most important health concerns in order of priority'
        )}
        
        <AnimatePresence>
          {activeSection === 'health' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className={keepOptions.keepHealthConcerns ? "opacity-50 pointer-events-none" : ""}>
                  <p className="text-sm text-gray-300 mb-3">List up to 3 health concerns you'd like to address</p>
                  
                  {[0, 1, 2].map((index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-4 p-4 border border-navy-600 rounded-md mb-4 bg-navy-750 hover:border-navy-500 transition-colors"
                    >
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Health concern {index + 1}
                        </label>
                        <input
                          type="text"
                          disabled={disabled || keepOptions.keepHealthConcerns}
                          placeholder="Describe your health concern"
                          {...register(`healthConcerns.${index}.description`)}
                          className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Type</label>
                          <select
                            disabled={disabled || keepOptions.keepHealthConcerns}
                            {...register(`healthConcerns.${index}.type`)}
                            className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          >
                            <option value="">Select type</option>
                            <option value="acute">Acute (recent)</option>
                            <option value="chronic">Chronic (long-term)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Severity</label>
                          <select
                            disabled={disabled || keepOptions.keepHealthConcerns}
                            {...register(`healthConcerns.${index}.severity`)}
                            className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          >
                            <option value="">Select severity</option>
                            <option value="1">1 - Mild</option>
                            <option value="2">2 - Moderate</option>
                            <option value="3">3 - Significant</option>
                            <option value="4">4 - Severe</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pain Locations Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle('Pain Locations', 'pain', 'keepPainLocations')}
        
        <AnimatePresence>
          {activeSection === 'pain' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className={keepOptions.keepPainLocations ? "opacity-50 pointer-events-none" : ""}>
                  <p className="text-sm text-gray-300 mb-3">Select all areas where you experience pain or discomfort</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {[
                      'Head', 'Neck', 'Shoulders', 'Upper back', 'Mid back', 'Lower back',
                      'Chest', 'Abdomen', 'Hips', 'Arms', 'Legs', 'Feet', 'Joints'
                    ].map((location, index) => (
                      <motion.label 
                        key={location}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center p-2 bg-navy-700 rounded-md hover:bg-navy-650 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || keepOptions.keepPainLocations}
                          value={location}
                          {...register('painLocations')}
                          className="text-gold-500 focus:ring-gold-500 h-4 w-4 rounded mr-2"
                        />
                        <span className="text-sm">{location}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>
                
                <div className={keepOptions.keepOtherPainLocation ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm text-gray-300 mb-1">
                    Other pain location (if not listed above)
                  </label>
                  <input
                    type="text"
                    disabled={disabled || keepOptions.keepOtherPainLocation}
                    placeholder="Describe other pain locations"
                    {...register('otherPainLocation')}
                    className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emotional Wellbeing Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle('Emotional Wellbeing', 'emotional', 'keepEmotionalState')}
        
        <AnimatePresence>
          {activeSection === 'emotional' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <div className={keepOptions.keepEmotionalState ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm text-gray-300 mb-1">
                    How would you describe your current emotional state?
                  </label>
                  <select
                    disabled={disabled || keepOptions.keepEmotionalState}
                    {...register('emotionalState', { required: "Please select your emotional state" })}
                    className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">Select your primary emotional state</option>
                    <option value="Calm and balanced">Calm and balanced</option>
                    <option value="Stressed">Stressed</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Depressed">Depressed</option>
                    <option value="Overwhelmed">Overwhelmed</option>
                    <option value="Fatigued">Fatigued</option>
                    <option value="Frustrated">Frustrated</option>
                    <option value="Grief">Grief</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.emotionalState && 
                    <p className="text-red-400 text-sm mt-1">{errors.emotionalState.message}</p>
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Environmental Factors Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle('Environmental Factors', 'environment', 'keepToxinExposure')}
        
        <AnimatePresence>
          {activeSection === 'environment' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className={keepOptions.keepToxinExposure ? "opacity-50 pointer-events-none" : ""}>
                  <p className="text-sm text-gray-300 mb-3">Select any environmental toxins you are regularly exposed to</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {[
                      'EMF', 'Mold', 'Chemicals', 'Heavy metals', 'Air pollution', 
                      'Water pollution', 'Pesticides', 'Industrial toxins'
                    ].map((toxin, index) => (
                      <motion.label 
                        key={toxin}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center p-2 bg-navy-700 rounded-md hover:bg-navy-650 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || keepOptions.keepToxinExposure}
                          value={toxin}
                          {...register('toxinExposure')}
                          className="text-gold-500 focus:ring-gold-500 h-4 w-4 rounded mr-2"
                        />
                        <span className="text-sm">{toxin}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>
                
                <div className={keepOptions.keepLifestyleFactors ? "opacity-50 pointer-events-none" : ""}>
                  <p className="text-sm text-gray-300 mb-3">Select lifestyle factors that may impact your health</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      'Sedentary work', 'Poor sleep', 'High stress', 'Poor diet', 
                      'Smoking', 'Alcohol use', 'Drug use', 'Physical labor', 'Shift work', 
                      'Frequent travel', 'Dehydration', 'Poor posture'
                    ].map((factor, index) => (
                      <motion.label 
                        key={factor}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center p-2 bg-navy-700 rounded-md hover:bg-navy-650 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || keepOptions.keepLifestyleFactors}
                          value={factor}
                          {...register('lifestyleFactors')}
                          className="text-gold-500 focus:ring-gold-500 h-4 w-4 rounded mr-2"
                        />
                        <span className="text-sm">{factor}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Healing Goals Section */}
      <div className="bg-navy-800 rounded-md overflow-hidden shadow-lg">
        {renderSectionTitle('Healing Goals', 'goals', 'keepHealingGoals')}
        
        <AnimatePresence>
          {activeSection === 'goals' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className={keepOptions.keepHealingGoals ? "opacity-50 pointer-events-none" : ""}>
                  <p className="text-sm text-gray-300 mb-3">What are your primary health goals? (Select all that apply)</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      'Pain relief', 'Better sleep', 'Stress reduction', 'More energy', 
                      'Mental clarity', 'Improved digestion', 'Hormone balance', 
                      'Emotional wellbeing', 'Physical performance', 'Immune support',
                      'Detoxification', 'Longevity', 'Weight management'
                    ].map((goal, index) => (
                      <motion.label 
                        key={goal}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center p-2 bg-navy-700 rounded-md hover:bg-navy-650 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || keepOptions.keepHealingGoals}
                          value={goal}
                          {...register('healingGoals')}
                          className="text-gold-500 focus:ring-gold-500 h-4 w-4 rounded mr-2"
                        />
                        <span className="text-sm">{goal}</span>
                      </motion.label>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm text-gray-300 mb-1">
                      Other health goals (if not listed above)
                    </label>
                    <textarea
                      disabled={disabled || keepOptions.keepHealingGoals}
                      placeholder="Describe any other health goals you have"
                      {...register('otherHealingGoals')}
                      className="w-full bg-navy-700 text-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-gold-500 min-h-[80px]"
                    ></textarea>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between gap-4 pt-4"
      >
        <button
          type="button"
          onClick={onGoBack}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 transition-colors rounded-md text-gray-200"
        >
          Back
        </button>
        
        <div className="flex gap-4">
          {!hasExistingQuestionnaire && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || disabled}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 transition-colors rounded-md text-gray-300"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || disabled}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-gold-500 to-yellow-500 hover:from-gold-600 hover:to-yellow-600 transition-colors rounded-md text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </motion.div>
    </form>
  );
};

export default QuestionnaireForm; 