import React from 'react';

import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as STEP from '@onboarding-constants/steps';
import { Text, Option, Wrapper, OnboardingButton } from '@onboarding-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const CreateOrRecoverStep = () => {
    const { goToNextStep, goToPreviousStep, addPath } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        addPath: onboardingActions.addPath,
    });

    return (
        <Wrapper.Step>
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <Translation id="TR_WELCOME_TO_TREZOR" />
                </Wrapper.StepHeading>

                <Text>
                    <Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/path-create-button"
                        action={() => {
                            addPath(STEP.PATH_CREATE);
                            goToNextStep();
                        }}
                        title={<Translation id="TR_CREATE_WALLET" />}
                        text={<Translation id="TR_IF_YOU_NEVER_HAD_WALLET" />}
                        button={<Translation id="TR_CREATE_WALLET" />}
                        imgSrc="images/svg/create-new.svg"
                    />
                    <Option
                        data-test="@onboarding/path-recovery-button"
                        action={() => {
                            addPath(STEP.PATH_RECOVERY);
                            goToNextStep();
                        }}
                        title={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                        text={<Translation id="TR_USING_EITHER_YOUR_SINGLE_BACKUP" />}
                        button={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                        imgSrc="images/svg/recover-from-seed.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back
                    onClick={() => {
                        goToPreviousStep('welcome');
                    }}
                >
                    <Translation id="TR_BACK" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default CreateOrRecoverStep;
