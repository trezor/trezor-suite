import React, { useMemo } from 'react';
import { OnboardingLayout } from 'src/components/onboarding';
import { WelcomeLayout } from 'src/components/suite';
import { ReduxModal } from 'src/components/suite/ModalSwitcher/ReduxModal';
import WelcomeStep from 'src/views/onboarding/steps/Welcome';
import CreateOrRecover from 'src/views/onboarding/steps/CreateOrRecover';
import FirmwareStep from 'src/views/onboarding/steps/Firmware';
import { ResetDeviceStep } from 'src/views/onboarding/steps/ResetDevice';
import { RecoveryStep } from 'src/views/onboarding/steps/Recovery';
import { BackupStep } from 'src/views/onboarding/steps/Backup';
import SecurityStep from 'src/views/onboarding/steps/Security';
import SetPinStep from 'src/views/onboarding/steps/Pin';
import BasicSettingsStep from 'src/views/onboarding/steps/BasicSettings';
import { FinalStep } from 'src/views/onboarding/steps/Final';
import UnexpectedState from 'src/views/onboarding/unexpected-states';
import { useOnboarding, useFilteredModal } from 'src/hooks/suite';
import { MODAL } from 'src/actions/suite/constants';
import * as STEP from 'src/constants/onboarding/steps';
import type { PrerequisiteType } from 'src/types/suite';

type OnboardingProps = {
    prerequisite?: PrerequisiteType;
};

export const Onboarding = ({ prerequisite }: OnboardingProps) => {
    const { activeStepId } = useOnboarding();

    const [StepComponent, LayoutComponent, prerequisitesGuidePadded] = useMemo(() => {
        switch (activeStepId) {
            case STEP.ID_WELCOME_STEP:
                // Welcome Layout with Connect device prompt and Analytics toggle
                return [WelcomeStep, WelcomeLayout, true];
            case STEP.ID_FIRMWARE_STEP:
                // Firmware installation
                return [FirmwareStep, OnboardingLayout];
            case STEP.ID_CREATE_OR_RECOVER:
                // Selection between a new seed or seed recovery
                return [CreateOrRecover, OnboardingLayout];
            case STEP.ID_RESET_DEVICE_STEP:
                // a) Generating a new seed, selection between single seed or shamir seed (only TT supported)
                return [ResetDeviceStep, OnboardingLayout];
            case STEP.ID_RECOVERY_STEP:
                // b) Seed recovery
                return [RecoveryStep, OnboardingLayout];
            case STEP.ID_SECURITY_STEP:
                // Security intro (BACKUP, PIN), option to skip them
                return [SecurityStep, OnboardingLayout];
            case STEP.ID_BACKUP_STEP:
                // Seed backup
                return [BackupStep, OnboardingLayout];
            case STEP.ID_SET_PIN_STEP:
                // Pin setup
                return [SetPinStep, OnboardingLayout];
            case STEP.ID_COINS_STEP:
                // Suite settings
                return [BasicSettingsStep, OnboardingLayout];
            case STEP.ID_FINAL_STEP:
                return [FinalStep, OnboardingLayout];
            default:
                console.error('no corresponding component found');
                return [() => null, WelcomeStep];
        }
    }, [activeStepId]);

    const allowedModal = useFilteredModal(
        [MODAL.CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );

    return (
        <LayoutComponent>
            {allowedModal && <ReduxModal {...allowedModal} />}
            <UnexpectedState
                prerequisite={prerequisite}
                prerequisitesGuidePadded={prerequisitesGuidePadded}
            >
                <StepComponent />
            </UnexpectedState>
        </LayoutComponent>
    );
};
