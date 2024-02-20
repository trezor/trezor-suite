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
                heading={<Translation id="TR_SECURITY_HEADING" />}
                description={<Translation id="TR_SECURITY_SUBHEADING" />}
                innerActions={
                    <OnboardingButtonCta
                        data-test="@onboarding/create-backup-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                    >
                        <Translation id="TR_GO_TO_SECURITY" />
                    </OnboardingButtonCta>
                }
                outerActions={
                    <OnboardingButtonSkip
                        data-test="@onboarding/skip-backup"
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
