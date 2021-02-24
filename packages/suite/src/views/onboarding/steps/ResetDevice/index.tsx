import React from 'react';
import { Link } from '@trezor/components';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { Translation } from '@suite-components';
import { SuccessImg, H2, P } from '@firmware-components';
import { TOS_URL } from '@suite-constants/urls';
import { useActions, useSelector } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const ResetDeviceStep = () => {
    const { resetDevice, goToPreviousStep, callActionAndGoToNextStep } = useActions({
        resetDevice: deviceSettingsActions.resetDevice,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        callActionAndGoToNextStep: onboardingActions.callActionAndGoToNextStep,
    });
    const device = useSelector(state => state.suite.device);

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
                {isShamirBackupAvailable() && <Translation id="TR_BACKUP_TYPE" />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!isShamirBackupAvailable() && (
                    <>
                        <SuccessImg model={device.features.major_version || 2} />
                        <H2>
                            <Translation id="TR_CREATE_WALLET" />
                        </H2>
                    </>
                )}

                {isShamirBackupAvailable() && (
                    <Text>
                        <Translation id="TR_YOU_MAY_CHOSE_EITHER_STANDARD" />
                    </Text>
                )}

                <P>
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
                {isShamirBackupAvailable() && (
                    <Wrapper.Options>
                        <Option
                            data-test="@onboarding/button-standard-backup"
                            action={() => {
                                callActionAndGoToNextStep(
                                    // eslint-disable-next-line @typescript-eslint/naming-convention
                                    () => resetDevice({ backup_type: 0 }),
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
                                callActionAndGoToNextStep(
                                    // eslint-disable-next-line @typescript-eslint/naming-convention
                                    () => resetDevice({ backup_type: 1 }),
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
                                callActionAndGoToNextStep(resetDevice, STEP.ID_SECURITY_STEP)
                            }
                        >
                            <Translation id="TR_CREATE_WALLET" />
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back onClick={() => goToPreviousStep()}>
                    <Translation id="TR_BACK" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default ResetDeviceStep;
