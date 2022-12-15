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
import { useActions, useSelector, useOnboarding } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { getDeviceModel } from '@trezor/device-utils';

export const ResetDeviceStep = () => {
    const [submitted, setSubmitted] = useState(false);
    const { resetDevice } = useActions({
        resetDevice: deviceSettingsActions.resetDevice,
    });
    const { goToPreviousStep, goToNextStep, updateAnalytics } = useOnboarding();

    const device = useSelector(state => state.suite.device);
    const deviceModel = getDeviceModel(device);

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const isShamirBackupAvailable = device.features?.capabilities?.includes('Capability_Shamir');
    const isWaitingForConfirmation =
        device.buttonRequests.some(
            r => r.code === 'ButtonRequest_ResetDevice' || r.code === 'ButtonRequest_ProtectCall',
        ) && !submitted; // ButtonRequest_ResetDevice is for TT, ButtonRequest_ProtectCall for T1

    const onResetDevice = async (params?: { backup_type?: 0 | 1 | undefined }) => {
        setSubmitted(false);

        const result = await resetDevice(params);

        setSubmitted(true);

        if (result?.success) {
            goToNextStep(STEP.ID_SECURITY_STEP);
        }
    };

    const handleSingleseedReset = async () => {
        if (isShamirBackupAvailable) {
            await onResetDevice({ backup_type: 0 });
        } else {
            await onResetDevice();
        }

        updateAnalytics({ recoveryType: undefined, seedType: 'standard' });
    };

    const handleShamirReset = async () => {
        await onResetDevice({ backup_type: 1 });

        updateAnalytics({
            recoveryType: undefined,
            seedType: 'shamir',
        });
    };

    return (
        <OnboardingStepBox
            image="KEY"
            heading={<Translation id="TR_ONBOARDING_GENERATE_SEED" />}
            description={<Translation id="TR_ONBOARDING_GENERATE_SEED_DESCRIPTION" />}
            deviceModel={isWaitingForConfirmation ? deviceModel : undefined}
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
                            onClick={handleSingleseedReset}
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
                                    onClick={handleShamirReset}
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
