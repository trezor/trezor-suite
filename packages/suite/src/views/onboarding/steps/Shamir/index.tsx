import React from 'react';
import { Link } from '@trezor/components-v2';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { TOS_URL } from '@suite-constants/urls';
import { Props } from './Container';

const ShamirStep = (props: Props) => {
    const { device } = props;

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const getModel = () => {
        return device.features.major_version;
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getModel() === 1 && 'Almost there! Prepare to launch'}
                {getModel() === 2 && 'Seed type'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getModel() === 1 && (
                    <Text>
                        You are one step from creating your wallet. By clicking the button below you
                        agree with <Link href={TOS_URL}>TOS</Link>
                    </Text>
                )}
                {getModel() === 2 && (
                    <Text>You might chose either standard backup type or shamir backups</Text>
                )}

                {getModel() === 2 && (
                    <Wrapper.Options>
                        <Option
                            data-test="@onboarding/button-standard-backup"
                            action={() => {
                                props.setBackupType(0);
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                            title="Single seed"
                            text="Security level: Standard. Distributable: No"
                            button="Select single seed"
                            imgSrc="images/onboarding/seed-card-single.svg"
                        />

                        <Option
                            action={() => {
                                props.setBackupType(1);
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                            title="Shamir seed"
                            text="Security level: Advanced Distributable: Yes"
                            button="Select Shamir seed"
                            imgSrc="images/onboarding/seed-card-shamir.svg"
                        />
                    </Wrapper.Options>
                )}
                {getModel() === 1 && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            Create the wallet
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back onClick={() => props.goToPreviousStep()}>
                    Back
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default ShamirStep;
