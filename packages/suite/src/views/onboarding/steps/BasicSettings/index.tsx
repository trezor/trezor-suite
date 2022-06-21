import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButtonCta } from '@onboarding-components';
import { useOnboarding, useSelector } from '@suite-hooks';
import BasicSettingsStepBox from './BasicSettingsStepBox';
import AdvancedSetup from './AdvancedSetup';
import { getIsTorLoading } from '@suite-utils/tor';

const BasicSettings = () => {
    const { noNetworkEnabled, isTorLoading } = useSelector(state => ({
        noNetworkEnabled: !state.wallet.settings.enabledNetworks.length,
        isTorLoading: getIsTorLoading(state.suite.torStatus),
    }));

    const { goToNextStep } = useOnboarding();

    return (
        <BasicSettingsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            outerActions={
                <AdvancedSetup>
                    <OnboardingButtonCta
                        data-test="@onboarding/coins/continue-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                        isLoading={isTorLoading}
                        isDisabled={noNetworkEnabled}
                    >
                        <Translation id="TR_COMPLETE_SETUP" />
                    </OnboardingButtonCta>
                </AdvancedSetup>
            }
        />
    );
};

export default BasicSettings;
