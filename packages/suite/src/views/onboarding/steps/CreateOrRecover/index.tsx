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
                    <Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/path-create-button"
                        action={() => {
                            props.addPath(STEP.PATH_CREATE);
                            props.goToNextStep();
                        }}
                        title={<Translation id="TR_CREATE_WALLET" />}
                        text={<Translation id="TR_IF_YOU_NEVER_HAD_WALLET" />}
                        button={<Translation id="TR_CREATE_WALLET" />}
                        imgSrc="images/svg/create-new.svg"
                    />
                    <Option
                        data-test="@onboarding/path-recovery-button"
                        action={() => {
                            props.addPath(STEP.PATH_RECOVERY);
                            props.goToNextStep();
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
                        props.goToPreviousStep('welcome');
                    }}
                >
                    <Translation id="TR_BACK" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default CreateOrRecoverStep;
