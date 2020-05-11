import React from 'react';

import { Translation } from '@suite-components';
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
            <Wrapper.StepHeading>
                <Translation id="TR_SELECT_DEVICE_STATUS" />
            </Wrapper.StepHeading>
            <Text>
                <Translation id="TR_YOU_CAN_SELECT_EITHER" />
            </Text>
            <Wrapper.StepBody>
                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/path-new-button"
                        action={() => {
                            handleNewDeviceOnClick();
                        }}
                        title={<Translation id="TR_I_HAVE_A_NEW_DEVICE" />}
                        text={<Translation id="TR_SEALED_PACKAGE_THAT" />}
                        button={<Translation id="TR_NEW_DEVICE" />}
                        imgSrc="images/svg/new-device.svg"
                    />

                    <Option
                        data-test="@onboarding/path-used-button"
                        action={() => {
                            props.onboardingActions.addPath(STEP.PATH_USED);
                            props.onboardingActions.goToNextStep();
                        }}
                        title={<Translation id="TR_I_HAVE_A_USED_DEVICE" />}
                        text={<Translation id="TR_UNPACKED_DEVICE_THAT" />}
                        button={<Translation id="TR_USED_DEVICE" />}
                        imgSrc="images/svg/used-device.svg"
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
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default NewOrUsedStep;
