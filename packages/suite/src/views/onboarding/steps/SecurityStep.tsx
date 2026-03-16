import { useState } from 'react';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';

import { SkipStepConfirmation } from 'src/components/onboarding/SkipStepConfirmation';
import { useOnboarding } from 'src/hooks/suite';

export const SecurityStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep, updateAnalytics } = useOnboarding();

    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
            )}
            <OnboardingCard
                iconName="check"
                heading={<Translation id="TR_YOUR_WALLET_SUCCESSFULLY_CREATED" />}
                description={<Translation id="TR_YOUR_WALLET_IS_ALMOST_READY_DESCRIPTION" />}
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/create-backup-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                    >
                        <Translation id="TR_CONTINUE_TO_BACKUP" />
                    </OnboardingCard.Button>
                }
                outerActions={
                    <OnboardingCard.SecondaryButton
                        data-testid="@onboarding/skip-backup"
                        onClick={() => {
                            setShowSkipConfirmation(true);
                            updateAnalytics({ backup: 'skip' });
                        }}
                    >
                        <Translation id="TR_SKIP_BACKUP" />
                    </OnboardingCard.SecondaryButton>
                }
            />
        </>
    );
};
