import React from 'react';

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
            <Wrapper.StepHeading>Select device status</Wrapper.StepHeading>
            <Text>
                You can select either a brand new Trezor or any Trezor device that has been used
                before and already initialized.
            </Text>
            <Wrapper.StepBody>
                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/button-new-path"
                        action={() => {
                            handleNewDeviceOnClick();
                        }}
                        title="I have a new device"
                        text="Sealed package that you just bought or received"
                        button="New device"
                        imgSrc="images/onboarding/new-device.svg"
                    />

                    <Option
                        data-test="@onboarding/button-used-path"
                        action={() => {
                            props.onboardingActions.addPath(STEP.PATH_USED);
                            props.onboardingActions.goToNextStep();
                        }}
                        title="I have a used device"
                        text="Unpacked device that has been already used before"
                        button="Used device"
                        imgSrc="images/onboarding/used-device.svg"
                    />
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
