import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { useOnboarding, useSelector } from 'src/hooks/suite';
import { getIsTorLoading } from 'src/utils/suite/tor';

import { CoinsStepBox } from './CoinsStepBox';

export const CoinsStep = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);
    const { goToSuite } = useOnboarding();

    const noNetworkEnabled = !enabledNetworks.length;
    const isTorLoading = getIsTorLoading(torStatus);

    return (
        <CoinsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            innerActions={
                <OnboardingCard.Button
                    data-testid="@onboarding/complete-onboarding"
                    onClick={goToSuite}
                    isLoading={isTorLoading}
                    isDisabled={noNetworkEnabled}
                >
                    <Translation id="TR_COMPLETE_SETUP" />
                </OnboardingCard.Button>
            }
        />
    );
};
