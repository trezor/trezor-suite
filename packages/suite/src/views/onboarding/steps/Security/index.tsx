import React, { useState } from 'react';
import { Translation } from '@suite-components';
import {
    OnboardingButtonCta,
    OnboardingButtonSkip,
    OnboardingStepBox,
    SkipStepConfirmation,
} from '@onboarding-components';
import { useOnboarding } from '@suite-hooks';

const SecurityStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep } = useOnboarding();
    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation
                    onCancel={() => setShowSkipConfirmation(false)}
                    variant="backup"
                />
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
                        onClick={() => setShowSkipConfirmation(true)}
                    >
                        <Translation id="TR_SKIP_BACKUP" />
                    </OnboardingButtonSkip>
                }
            />
        </>
    );
};

export default SecurityStep;
