import React from 'react';
import { Button } from '@trezor/components';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';

export const DeviceInitialize = () => {
    const { goto, resetOnboarding, enableOnboardingReducer } = useActions({
        // todo: there could be an utility action wrapping all these 3
        goto: routerActions.goto,
        resetOnboarding: onboardingActions.resetOnboarding,
        enableOnboardingReducer: onboardingActions.enableOnboardingReducer,
    });

    const handleCtaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // in case this prerequisite (device-initialize) is displayed inside onboarding app we need to reset onboarding state
        resetOnboarding();
        // and resetting state disables onboarding reducer so we need to enable it again
        enableOnboardingReducer(true);

        goto('onboarding-index');
    };

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
            cta={
                <Button data-test="@button/go-to-onboarding" onClick={handleCtaClick}>
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Button>
            }
            items={[
                {
                    key: 'device-initialize',
                    heading: <Translation id="TR_DEVICE_NOT_INITIALIZED" />,
                    description: <Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />,
                },
            ]}
        />
    );
};
