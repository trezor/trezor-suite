import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButtonCta } from '@onboarding-components';
import { useOnboarding, useSelector } from '@suite-hooks';
import BasicSettingsStepBox from './BasicSettingsStepBox';
import AdvancedSetup from './AdvancedSetup';

const BasicSettings = () => {
    const noNetworkEnabled = useSelector(s => !s.wallet.settings.enabledNetworks.length);
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
