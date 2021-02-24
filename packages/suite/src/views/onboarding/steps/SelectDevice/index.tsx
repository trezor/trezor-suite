import React from 'react';
import { Translation } from '@suite-components';
import { Wrapper, Text, OnboardingButton, Option } from '@onboarding-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { useActions } from '@suite-hooks';

const SelectDeviceStep = () => {
    const { goToPreviousStep, goToNextStep, selectTrezorModel } = useActions({
        goToPreviousStep: onboardingActions.goToPreviousStep,
        goToNextStep: onboardingActions.goToNextStep,
        selectTrezorModel: onboardingActions.selectTrezorModel,
    });

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation id="TR_SELECT_YOUR_DEVICE_HEADING" />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <Text>
                    <Translation id="TR_MODELS_DESC" />
                </Text>
                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/option-model-one-path"
                        action={() => {
                            selectTrezorModel(1);
                            goToNextStep();
                        }}
                        title={<Translation id="TR_MODEL_ONE" />}
                        text={<Translation id="TR_MODEL_ONE_DESC" />}
                        button={
                            <Translation
                                id="TR_SELECT_MODEL"
                                values={{ model: <Translation id="TR_MODEL_ONE" /> }}
                            />
                        }
                        imgSrc="images/svg/model-1.svg"
                    />
                    <Option
                        data-test="@onboarding/option-model-t-path"
                        action={() => {
                            selectTrezorModel(2);
                            goToNextStep();
                        }}
                        title={<Translation id="TR_MODEL_T" />}
                        text={<Translation id="TR_MODEL_T_DESC" />}
                        button={
                            <Translation
                                id="TR_SELECT_MODEL"
                                values={{ model: <Translation id="TR_MODEL_T" /> }}
                            />
                        }
                        imgSrc="images/svg/model-2.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() => {
                            goToPreviousStep();
                        }}
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SelectDeviceStep;
