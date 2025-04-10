export type HealthConcern = {
  description: string;
  type: 'acute' | 'chronic';
  severity: 1 | 2 | 3 | 4;
  _id?: string;
};

export type QuestionnaireData = {
  isPregnant: boolean;
  healthConcerns: HealthConcern[];
  painLocations: string[];
  otherPainLocation?: string;
  emotionalState: string;
  toxinExposure: string[];
  lifestyleFactors: string[];
  healingGoals: string[];
  otherHealingGoals?: string;
  packageId?: string | null;
  packageType?: string;
};

export type PackageType = 'none' | 'single' | 'basic' | 'enhanced' | 'premium'; 