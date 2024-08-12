import { useState } from 'react';
import { Translation } from 'src/components/suite';
import {
    OnboardingButtonCta,
    OnboardingButtonSkip,
    OnboardingStepBox,
    SkipStepConfirmation,
} from 'src/components/onboarding';
import { useOnboarding } from 'src/hooks/suite';

const SecurityStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep, updateAnalytics } = useOnboarding();

    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
            )}
            <OnboardingStepBox
                image="FOLDER"
                heading={<Translation id="TR_YOUR_WALLET_SUCCESSFULLY_CREATED" />}
                description={<Translation id="TR_YOUR_WALLET_IS_ALMOST_READY_DESCRIPTION" />}
                innerActions={
                    <OnboardingButtonCta
                        data-testid="@onboarding/create-backup-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                    >
                        <Translation id="TR_CONTINUE_TO_BACKUP" />
                    </OnboardingButtonCta>
                }
                outerActions={
                    <OnboardingButtonSkip
                        data-testid="@onboarding/skip-backup"
                        onClick={() => {
                            setShowSkipConfirmation(true);
                            updateAnalytics({ backup: 'skip' });
                        }}
                    >
                        <Translation id="TR_SKIP_BACKUP" />
                    </OnboardingButtonSkip>
                }
            />
        </>
    );
};

export default SecurityStep;
