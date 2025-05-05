import { useMemo } from 'react';

import { exhaustive } from '@trezor/type-utils';

import { MODAL } from 'src/actions/suite/constants';
import { OnboardingLayout } from 'src/components/onboarding';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import * as STEP from 'src/constants/onboarding/steps';
import { useFilteredModal, useOnboarding } from 'src/hooks/suite';
import UnexpectedState from 'src/views/onboarding/UnexpectedState';
import { BackupStep } from 'src/views/onboarding/steps/Backup';
import BasicSettingsStep from 'src/views/onboarding/steps/BasicSettings';
import CreateOrRecover from 'src/views/onboarding/steps/CreateOrRecover';
import { FinalStep } from 'src/views/onboarding/steps/Final';
import { FirmwareStep } from 'src/views/onboarding/steps/FirmwareStep';
import SetPinStep from 'src/views/onboarding/steps/Pin';
import { RecoveryStep } from 'src/views/onboarding/steps/Recovery';
import { ResetDeviceStep } from 'src/views/onboarding/steps/ResetDevice';
import SecurityStep from 'src/views/onboarding/steps/Security';

import { DeviceTutorial } from './steps/DeviceTutorial';
import { DeviceAuthenticity } from './steps/SecurityCheck/DeviceAuthenticity';

export const Onboarding = () => {
    const { activeStepId, goToNextStep } = useOnboarding();

    const StepComponent = useMemo(() => {
        switch (activeStepId) {
            case STEP.ID_FIRMWARE_STEP:
                // Firmware installation
                return FirmwareStep;
            case STEP.ID_AUTHENTICATE_DEVICE_STEP:
                // Device authenticity check
                return () => <DeviceAuthenticity goToNext={() => goToNextStep()} />;
            case STEP.ID_TUTORIAL_STEP:
                // Device tutorial
                return DeviceTutorial;
            case STEP.ID_CREATE_OR_RECOVER:
                // Selection between a new seed or seed recovery
                return CreateOrRecover;
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
                return SetPinStep;
            case STEP.ID_COINS_STEP:
                // Suite settings
                return BasicSettingsStep;
            case STEP.ID_FINAL_STEP:
                return FinalStep;
            default:
                return exhaustive(activeStepId);
        }
    }, [activeStepId, goToNextStep]);

    const allowedModal = useFilteredModal(
        [MODAL.CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );

    return (
        <OnboardingLayout>
            {allowedModal && <ReduxModal {...allowedModal} />}

            <UnexpectedState>
                <StepComponent />
            </UnexpectedState>
        </OnboardingLayout>
    );
};
