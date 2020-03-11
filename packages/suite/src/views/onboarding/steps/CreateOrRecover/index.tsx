import React from 'react';

import { Translation } from '@suite-components';
import * as STEP from '@onboarding-constants/steps';
import { Text, Option, Wrapper, OnboardingButton } from '@onboarding-components';

import { Props } from './Container';

const CreateOrRecoverStep = (props: Props) => {
    return (
        <Wrapper.Step>
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <Translation id="TR_WELCOME_TO_TREZOR" />
                </Wrapper.StepHeading>

                <Text>
                    <Translation id="TR_WELCOME_TO_TREZOR_TEXT" />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/path-create-button"
                        action={() => {
                            props.addPath(STEP.PATH_CREATE);
                            props.goToNextStep();
                        }}
                        title="Create new Wallet"
                        text="If you never had any Wallet or want to create fresh one"
                        button="Create a new Wallet"
                        imgSrc="images/svg/create-new.svg"
                    />
                    <Option
                        data-test="@onboarding/path-recovery-button"
                        action={() => {
                            props.addPath(STEP.PATH_RECOVERY);
                            props.goToNextStep();
                        }}
                        title="Restore existing wallet"
                        text="Using either your single backup seed or Shamir backup seed"
                        button="Restore existing wallet"
                        imgSrc="images/svg/recover-from-seed.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back
                    onClick={() => {
                        props.goToPreviousStep();
                    }}
                >
                    Back
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default CreateOrRecoverStep;
