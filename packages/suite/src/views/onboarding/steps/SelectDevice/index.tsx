import React from 'react';
import { Translation } from '@suite-components';
import { Wrapper, Text, OnboardingButton, Option } from '@onboarding-components';

import { Props } from './Container';

const SelectDeviceStep = ({ onboardingActions }: Props) => {
    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation id="TR_SELECT_YOUR_DEVICE_HEADING" />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <Text>
                    Trezor One features two buttons and a monochromatic screen, Trezor T is the
                    high-end model featuring touch-screen display.
                </Text>
                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/option-model-one-path"
                        action={() => {
                            onboardingActions.selectTrezorModel(1);
                            onboardingActions.goToNextStep();
                        }}
                        title="Trezor One"
                        text={<Translation id="TR_MODEL_ONE" />}
                        button="Select Trezor One"
                        imgSrc="images/svg/model-1.svg"
                    />
                    <Option
                        data-test="@onboarding/option-model-t-path"
                        action={() => {
                            onboardingActions.selectTrezorModel(2);
                            onboardingActions.goToNextStep();
                        }}
                        title="Trezor One"
                        text={<Translation id="TR_MODEL_T" />}
                        button="Select Trezor T"
                        imgSrc="images/svg/model-2.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() => {
                            onboardingActions.goToPreviousStep();
                        }}
                    >
                        Back
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SelectDeviceStep;
