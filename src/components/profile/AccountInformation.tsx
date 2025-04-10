import React, { useState } from 'react';
import { PackageDetails } from '../../types/models';
import { Card, CardHeader, CardSection } from '../ui/Card';
import { ActivePackageInfo, NoPackageInfo, HealthDataInfo } from './PackageInfo';
import QuestionnairePopup from './QuestionnairePopup';
import { Button } from '../ui/FormElements';
import { Clipboard } from 'lucide-react';

interface AccountInformationProps {
  hasActivePackage: boolean;
  packageInfo: PackageDetails | null;
}

export default function AccountInformation({ hasActivePackage, packageInfo }: AccountInformationProps) {
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  
  return (
    <Card>
      <CardHeader title="Account Information" />
      
      {/* Package Information */}
      <CardSection title="Package Status">
        {hasActivePackage && packageInfo ? (
          <ActivePackageInfo 
            packageInfo={packageInfo} 
            onViewQuestionnaire={() => setIsQuestionnaireOpen(true)} 
          />
        ) : (
          <NoPackageInfo />
        )}
      </CardSection>
      
      {/* Health Data Section - Made more prominent */}
      {hasActivePackage && packageInfo?.healing_data && (
        <CardSection title="Health Questionnaire" 
          titleClassName="text-gold-500 font-semibold"
          className="border-t-2 border-navy-700 mt-4 pt-4"
        >
          <div className="space-y-4">
            <HealthDataInfo healingData={packageInfo.healing_data} />
            
            <Button
              onClick={() => setIsQuestionnaireOpen(true)}
              variant="secondary"
              className="w-full mt-4 flex items-center justify-center gap-2"
            >
              <Clipboard className="w-4 h-4" />
              <span>View Complete Health Data</span>
            </Button>
          </div>
        </CardSection>
      )}
      
      {/* Questionnaire Popup */}
      {isQuestionnaireOpen && packageInfo?.healing_data && (
        <QuestionnairePopup 
          healingData={packageInfo.healing_data} 
          onClose={() => setIsQuestionnaireOpen(false)} 
        />
      )}
    </Card>
  );
} 