import React from 'react';
import { P } from '@trezor/components-v2';

import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { Props } from './Container';

const NewOrUsedStep = (props: Props) => {
    const handleNewDeviceOnClick = () => {
        props.onboardingActions.addPath(STEP.PATH_NEW);
        if (props.device && props.device.connected) {
            // skip select device step if device is already connected, has no benefit for user
            return props.onboardingActions.goToNextStep('unboxing');
        }
        return props.onboardingActions.goToNextStep();
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>Do you want to use new or used device?</Wrapper.StepHeading>
            <Text>
                Trezor Wallet is your account within Trezor ecosystem. It allows you to easily
                manage your funds and initiate transfers.
            </Text>
            <Wrapper.StepBody>
                <Wrapper.Options>
                    <Option>
                        <P weight="bold">I have a new device</P>
                        <Text>Sealed package that you just bought or received</Text>
                        <OnboardingButton.Cta
                            data-test="@onboarding/button-new-path"
                            onClick={() => {
                                handleNewDeviceOnClick();
                            }}
                        >
                            New device
                        </OnboardingButton.Cta>
                    </Option>

                    <Option>
                        <P weight="bold">I have a used device</P>
                        <Text>Unpacked device that has been already used before</Text>
                        <OnboardingButton.Alt
                            data-test="@onboarding/button-used-path"
                            onClick={() => {
                                props.onboardingActions.addPath(STEP.PATH_USED);
                                props.onboardingActions.goToNextStep();
                            }}
                        >
                            Used device
                        </OnboardingButton.Alt>
                    </Option>
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls isVertical>
                    <OnboardingButton.Back
                        onClick={() => {
                            props.onboardingActions.goToPreviousStep();
                        }}
                    >
                        Back
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default NewOrUsedStep;
