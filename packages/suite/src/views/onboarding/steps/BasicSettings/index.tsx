import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { getIsTorLoading } from 'src/utils/suite/tor';

import { BasicSettingsStepBox } from './BasicSettingsStepBox';

const BasicSettings = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);
    const { goToNextStep } = useOnboarding();

    const noNetworkEnabled = !enabledNetworks.length;
    const isTorLoading = getIsTorLoading(torStatus);

    return (
        <BasicSettingsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            innerActions={
                <OnboardingCard.Button
                    data-testid="@onboarding/coins/continue-button"
                    onClick={() => {
                        goToNextStep();
                    }}
                    isLoading={isTorLoading}
                    isDisabled={noNetworkEnabled}
                >
                    <Translation id="TR_COMPLETE_SETUP" />
                </OnboardingCard.Button>
            }
        />
    );
};

export default BasicSettings;
