import React, { useState } from 'react';
import * as STEP from '@onboarding-constants/steps';
import {
    OnboardingButtonBack,
    Option,
    OptionsWrapper,
    OptionWrapper,
    OptionsDivider,
    OnboardingStepBox,
} from '@onboarding-components';
import { Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const ResetDeviceStep = () => {
    const [submitted, setSubmitted] = useState(false);
    const { resetDevice, goToPreviousStep, goToNextStep } = useActions({
        resetDevice: deviceSettingsActions.resetDevice,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        goToNextStep: onboardingActions.goToNextStep,
    });
    const device = useSelector(state => state.suite.device);

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const isShamirBackupAvailable = device.features?.capabilities?.includes('Capability_Shamir');
    const isWaitingForConfirmation =
        device.buttonRequests.some(
            r => r === 'ButtonRequest_ResetDevice' || r === 'ButtonRequest_ProtectCall',
        ) && !submitted; // ButtonRequest_ResetDevice is for TT, ButtonRequest_ProtectCall for T1

    // eslint-disable-next-line camelcase
    const onResetDevice = async (params?: { backup_type?: 0 | 1 | undefined }) => {
        setSubmitted(false);
        const result = await resetDevice(params);
        setSubmitted(true);
        if (result?.success) {
            goToNextStep(STEP.ID_SECURITY_STEP);
        }
    };

    return (
        <OnboardingStepBox
            image="KEY"
            heading={<Translation id="TR_ONBOARDING_GENERATE_SEED" />}
            description={<Translation id="TR_ONBOARDING_GENERATE_SEED_DESCRIPTION" />}
            confirmOnDevice={isWaitingForConfirmation ? device?.features?.major_version : undefined}
            outerActions={
                !isWaitingForConfirmation ? (
                    // There is no point to show back button if user can't click it because confirmOnDevice bubble is active
                    <OnboardingButtonBack onClick={() => goToPreviousStep()}>
                        <Translation id="TR_BACK" />
                    </OnboardingButtonBack>
                ) : undefined
            }
        >
            {!isWaitingForConfirmation ? (
                // Show options to chose from only if we are not waiting for confirmation on the device (because that means user has already chosen )
                <OptionsWrapper fullWidth={false}>
                    <OptionWrapper>
                        <Option
                            icon="SEED_SINGLE"
                            data-test={
                                isShamirBackupAvailable
                                    ? '@onboarding/button-standard-backup'
                                    : '@onboarding/only-backup-option-button'
                            }
                            onClick={async () => {
                                if (isShamirBackupAvailable) {
                                    await onResetDevice({ backup_type: 0 });
                                } else {
                                    await onResetDevice();
                                }
                            }}
                            heading={<Translation id="SINGLE_SEED" />}
                            description={<Translation id="SINGLE_SEED_DESCRIPTION" />}
                        />
                    </OptionWrapper>
                    {isShamirBackupAvailable && (
                        <>
                            <OptionsDivider />
                            <OptionWrapper>
                                <Option
                                    icon="SEED_SHAMIR"
                                    data-test="@onboarding/shamir-backup-option-button"
                                    onClick={async () => {
                                        await onResetDevice({ backup_type: 1 });
                                    }}
                                    heading={<Translation id="SHAMIR_SEED" />}
                                    description={<Translation id="SHAMIR_SEED_DESCRIPTION" />}
                                />
                            </OptionWrapper>
                        </>
                    )}
                </OptionsWrapper>
            ) : undefined}
        </OnboardingStepBox>
    );
};

export default ResetDeviceStep;
