import React from 'react';
import { Link, P } from '@trezor/components';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
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
                {!isShamirBackupAvailable() && <Translation id="TR_CREATE_WALLET" />}
                {isShamirBackupAvailable() && <Translation id="TR_BACKUP_TYPE" />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!isShamirBackupAvailable() && (
                    <>
                        {device.features.major_version === 2 ? (
                            <Image image="FIRMWARE_SUCCESS_2" />
                        ) : (
                            <Image image="FIRMWARE_SUCCESS_1" />
                        )}
                    </>
                )}

                {isShamirBackupAvailable() && (
                    <Text>
                        <Translation id="TR_YOU_MAY_CHOSE_EITHER_STANDARD" />
                    </Text>
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
                            title={<Translation id="SINGLE_SEED" />}
                            text={<Translation id="SINGLE_SEED_DESCRIPTION" />}
                            button={
                                <Translation
                                    id="TR_SELECT_SEED_TYPE"
                                    values={{ seedType: <Translation id="SINGLE_SEED" /> }}
                                />
                            }
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
                            title={<Translation id="SHAMIR_SEED" />}
                            text={<Translation id="SHAMIR_SEED_DESCRIPTION" />}
                            button={
                                <Translation
                                    id="TR_SELECT_SEED_TYPE"
                                    values={{ seedType: <Translation id="SHAMIR_SEED" /> }}
                                />
                            }
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
                            <Translation id="TR_CREATE_WALLET" />
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}

                <P size="tiny">
                    <Translation
                        id="TR_BY_CREATING_WALLET"
                        values={{
                            TERMS_AND_CONDITIONS: (
                                <Link href={TOS_URL}>
                                    <Translation id="TERMS_AND_CONDTIONS" />
                                </Link>
                            ),
                        }}
                    />
                </P>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back onClick={() => props.goToPreviousStep()}>
                    <Translation id="TR_BACK" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default ResetDeviceStep;
