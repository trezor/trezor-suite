import React from 'react';
import { Translation } from 'src/components/suite';
import { OnboardingButtonCta } from 'src/components/onboarding';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { BasicSettingsStepBox } from './BasicSettingsStepBox';
import { AdvancedSetup } from './AdvancedSetup';
import { getIsTorLoading } from 'src/utils/suite/tor';

const BasicSettings = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);

    const { goToNextStep } = useOnboarding();

    const noNetworkEnabled = !enabledNetworks.length;
    const isTorLoading = getIsTorLoading(torStatus);

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
