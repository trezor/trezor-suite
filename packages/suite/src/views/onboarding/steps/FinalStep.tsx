import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectDeviceName } from '@suite-common/device';

import { useOnboarding, useSelector } from 'src/hooks/suite';

export const FinalStep = () => {
    const { goToSuite } = useOnboarding();
    const deviceName = useSelector(selectDeviceName);

    return (
        <OnboardingCard
            iconName="check"
            heading={<Translation id="TR_ONBOARDING_FINAL_HEADING" />}
            description={
                <Translation
                    id="TR_ONBOARDING_FINAL_DESCRIPTION"
                    values={{ deviceName: deviceName ?? 'Trezor' }}
                />
            }
            innerActions={
                <OnboardingCard.Button data-testid="@onboarding/final-button" onClick={goToSuite}>
                    <Translation id="TR_ONBOARDING_FINAL_GO_TO_DASHBOARD" />
                </OnboardingCard.Button>
            }
        />
    );
};
