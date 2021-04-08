import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButton } from '@onboarding-components';
import { useOnboarding } from '@suite-hooks';
import BasicSettingsStepBox from './BasicSettingsStepBox';

const BasicSettings = () => {
    const { goToNextStep } = useOnboarding();
    return (
        <BasicSettingsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            outerActions={
                <OnboardingButton.Cta
                    data-test="@onboarding/coins/continue-button"
                    onClick={() => {
                        goToNextStep();
                    }}
                >
                    <Translation id="TR_COMPLETE_SETUP" />
                </OnboardingButton.Cta>
            }
        />
    );
};

export default BasicSettings;
