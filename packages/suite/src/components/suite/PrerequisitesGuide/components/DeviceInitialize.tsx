import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, TroubleshootingTips } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceInitialize = () => {
    const { goto, resetOnboarding, enableOnboardingReducer } = useActions({
        // todo: there could be an utility action wrapping all these 3
        goto: routerActions.goto,
        resetOnboarding: onboardingActions.resetOnboarding,
        enableOnboardingReducer: onboardingActions.enableOnboardingReducer,
    });

    return (
        <Wrapper>
            <TroubleshootingTips
                label={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
                cta={
                    <Button
                        data-test="@button/go-to-onboarding"
                        onClick={e => {
                            e.stopPropagation();
                            // in case this prerequisite (device-initialize) is displayed inside onboarding app we need to reset onboarding state
                            resetOnboarding();
                            // and resetting state disables onboarding reducer so we need to enable it again
                            enableOnboardingReducer(true);
                            goto('onboarding-index');
                        }}
                    >
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
        </Wrapper>
    );
};

export default DeviceInitialize;
