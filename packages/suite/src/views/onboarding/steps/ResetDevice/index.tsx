import React from 'react';
import { Link } from '@trezor/components';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { TOS_URL } from '@suite-constants/urls';
import { Props } from './Container';

const ResetDeviceStep = (props: Props) => {
    const { device } = props;

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const isShamirBackupAvailable = () => {
        return device.features?.capabilities?.includes('Capability_Shamir');
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {!isShamirBackupAvailable() && 'Almost there! Prepare to launch'}
                {isShamirBackupAvailable() && 'Backup type'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!isShamirBackupAvailable() && (
                    <Text>
                        You are one step from creating your wallet. By clicking the button below you
                        agree with <Link href={TOS_URL}>TOS</Link>
                    </Text>
                )}

                {isShamirBackupAvailable() && (
                    <Text>You might chose either standard backup type or shamir backups</Text>
                )}

                {isShamirBackupAvailable() && (
                    <Wrapper.Options>
                        <Option
                            data-test="@onboarding/button-standard-backup"
                            action={() => {
                                props.callActionAndGoToNextStep(
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    () => props.resetDevice({ backup_type: 0 }),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                            title="Single seed"
                            text="Security level: Standard. Distributable: No"
                            button="Select single seed"
                            imgSrc="images/svg/seed-card-single.svg"
                        />

                        <Option
                            action={() => {
                                props.callActionAndGoToNextStep(
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    () => props.resetDevice({ backup_type: 1 }),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                            title="Shamir seed"
                            text="Security level: Advanced Distributable: Yes"
                            button="Select Shamir seed"
                            imgSrc="images/svg/seed-card-shamir.svg"
                        />
                    </Wrapper.Options>
                )}
                {!isShamirBackupAvailable() && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta
                            data-test="@onboarding/only-backup-option-button"
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    props.resetDevice,
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

export default ResetDeviceStep;
