import { useState } from 'react';

import { IntroBackupCard } from '../IntroBackupCard';
import { NoN4W1Tags } from '../NoN4W1Tags';
import { SelectBackupType } from '../SelectBackupType';

type InitialSteps = 'intro' | 'select' | 'no-tags';

export const InitialBackupFlow = () => {
    const [currentStep, setCurrentStep] = useState<InitialSteps>('intro');
    // console.log(currentStep);

    switch (currentStep) {
        case 'intro':
            return (
                <IntroBackupCard
                    onContinue={() => {
                        setCurrentStep('select');
                    }}
                />
            );
        case 'select':
            return (
                <SelectBackupType
                    onBack={() => {
                        setCurrentStep('intro');
                    }}
                    onContinueWithN4W1={() => {}}
                    onContinueWithoutN4W1={() => {
                        setCurrentStep('no-tags');
                    }}
                />
            );
        case 'no-tags':
            return <NoN4W1Tags />;
    }
};
