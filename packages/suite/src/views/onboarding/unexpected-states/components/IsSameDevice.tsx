import React from 'react';
import { OnboardingButtonAlt, OnboardingStepBox } from '@onboarding-components';
import { Translation } from '@suite-components';
import { useOnboarding } from '@suite-hooks';

const IsSameDevice = () => {
    const { resetOnboarding, enableOnboardingReducer } = useOnboarding();
    return (
        <OnboardingStepBox
            disableConfirmWrapper
            heading={<Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING" />}
            description={
                <>
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1" />
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2" />
                </>
            }
            innerActions={
                <OnboardingButtonAlt
                    onClick={() => {
                        resetOnboarding();
                        enableOnboardingReducer(true);
                    }}
                    data-test="@onboarding/unexpected-state/is-same/start-over-button"
                >
                    <Translation id="TR_START_AGAIN" />
                </OnboardingButtonAlt>
            }
        />
    );
};

export default IsSameDevice;
