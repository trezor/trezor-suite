import { useEffect, useMemo } from 'react';

import { goto } from '@suite/router';
import { STEP } from '@suite/onboarding';
import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { exhaustive } from '@trezor/type-utils';

import { OnboardingLayout } from 'src/components/onboarding/OnboardingLayout';
import { useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { UnexpectedState } from 'src/views/onboarding/UnexpectedState';
import { BackupStep } from 'src/views/onboarding/steps/BackupStep';
import { CoinsStep } from 'src/views/onboarding/steps/CoinsStep';
import { CreateOrRecoverStep } from 'src/views/onboarding/steps/CreateOrRecoverStep';
import { DeviceAuthenticityStep } from 'src/views/onboarding/steps/DeviceAuthenticityStep';
import { DeviceTutorialStep } from 'src/views/onboarding/steps/DeviceTutorialStep';
import { FirmwareStep } from 'src/views/onboarding/steps/FirmwareStep';
import { PinStep } from 'src/views/onboarding/steps/PinStep';
import { RecoveryStep } from 'src/views/onboarding/steps/RecoveryStep';
import { ResetDeviceStep } from 'src/views/onboarding/steps/ResetDeviceStep';
import { SecurityStep } from 'src/views/onboarding/steps/SecurityStep';

export const Onboarding = () => {
    const dispatch = useDispatch();

    const { activeStepId, goToNextStep } = useOnboarding();
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);

    // This is a temporary hack until we refactor onboarding.
    // We cant include THP modals in the onboarding flow, so in this specific edge
    // we redirect user to the dashboard where onboarding starts over and picks up where it ended.
    useEffect(() => {
        if (activeStepId !== STEP.ID_FIRMWARE_STEP && thpStep === 'ConfirmOnlyConnection') {
            dispatch(goto({ routeName: 'suite-index' }));
        }
    }, [device, thpStep, activeStepId, dispatch]);

    const StepComponent = useMemo(() => {
        switch (activeStepId) {
            case STEP.ID_FIRMWARE_STEP:
                // Firmware installation
                return FirmwareStep;
            case STEP.ID_AUTHENTICATE_DEVICE_STEP:
                // Device authenticity check
                return () => <DeviceAuthenticityStep goToNext={() => goToNextStep()} />;
            case STEP.ID_TUTORIAL_STEP:
                // Device tutorial
                return DeviceTutorialStep;
            case STEP.ID_CREATE_OR_RECOVER:
                // Selection between a new seed or seed recovery
                return CreateOrRecoverStep;
            case STEP.ID_RESET_DEVICE_STEP:
                // a) Generating a new seed, selection between seed types
                return ResetDeviceStep;
            case STEP.ID_RECOVERY_STEP:
                // b) Seed recovery
                return RecoveryStep;
            case STEP.ID_SECURITY_STEP:
                // Security intro (BACKUP, PIN), option to skip them
                return SecurityStep;
            case STEP.ID_BACKUP_STEP:
                // Seed backup
                return BackupStep;
            case STEP.ID_SET_PIN_STEP:
                // Pin setup
                return PinStep;
            case STEP.ID_COINS_STEP:
                // Suite settings
                return CoinsStep;
            default:
                return exhaustive(activeStepId);
        }
    }, [activeStepId, goToNextStep]);

    return (
        <OnboardingLayout>
            <UnexpectedState>
                <StepComponent />
            </UnexpectedState>
        </OnboardingLayout>
    );
};
