import React from 'react';
import { WelcomeLayout, OnboardingLayout } from '@onboarding-components';
import WelcomeStep from '@onboarding-views/steps/Welcome';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover';
import FirmwareStep from '@onboarding-views/steps/Firmware';
import ResetDeviceStep from '@suite/views/onboarding/steps/ResetDevice';
import RecoveryStep from '@onboarding-views/steps/Recovery';
import BackupStep from '@onboarding-views/steps/Backup';
import SecurityStep from '@onboarding-views/steps/Security';
import SetPinStep from '@onboarding-views/steps/Pin';
import BasicSettingsStep from '@onboarding-views/steps/BasicSettings';
import FinalStep from '@onboarding-views/steps/Final';
import UnexpectedState from '@onboarding-views/unexpected-states';
import { useOnboarding } from '@suite-hooks';
import * as STEP from '@onboarding-constants/steps';

const Onboarding = () => {
    const { activeStepId } = useOnboarding();

    const getStepComponent = () => {
        switch (activeStepId) {
            case STEP.ID_WELCOME_STEP:
                // Welcome Layout with Connect device prompt and Analytics toggle
                return WelcomeStep;
            case STEP.ID_FIRMWARE_STEP:
                // Firmware installation
                return FirmwareStep;
            case STEP.ID_CREATE_OR_RECOVER:
                // Selection between a new seed or seed recovery
                return CreateOrRecover;
            case STEP.ID_RESET_DEVICE_STEP:
                // a) Generating a new seed, selection between single seed or shamir seed (only TT supported)
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
                console.error('no corresponding component found');
                return () => null;
        }
    };

    const StepComponent = getStepComponent();
    const LayoutComponent = activeStepId === 'welcome' ? WelcomeLayout : OnboardingLayout;

    // TODO global unexpected states
    return (
        <LayoutComponent>
            <UnexpectedState>
                <StepComponent />
            </UnexpectedState>
        </LayoutComponent>
    );
};

export default Onboarding;
