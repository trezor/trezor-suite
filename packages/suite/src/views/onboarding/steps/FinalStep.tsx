import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { CheckIcon } from '@trezor/icons';

import { useOnboarding } from 'src/hooks/suite';

export const FinalStep = () => {
    const { goToSuite, onboardedDevice } = useOnboarding();
    const deviceName = onboardedDevice?.name;

    return (
        <OnboardingCard
            icon={CheckIcon}
            heading={<Translation id="TR_ONBOARDING_FINAL_HEADING" />}
            description={
                <Translation
                    id="TR_ONBOARDING_FINAL_DESCRIPTION"
                    values={{ deviceName: deviceName ?? 'Trezor' }}
                />
            }
            innerActions={
                <OnboardingCard.Button
                    data-testid="@onboarding/final-button"
                    onClick={() => goToSuite()}
                >
                    <Translation id="TR_ONBOARDING_FINAL_GO_TO_DASHBOARD" />
                </OnboardingCard.Button>
            }
        />
    );
};
