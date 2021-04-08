import React from 'react';
import styled from 'styled-components';
import { Step } from '@onboarding-types';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import { isStepInPath } from '@onboarding-utils/steps';
import { useOnboarding } from '@suite-hooks';

import WelcomeStep from '@onboarding-views/steps/Welcome';
import SkipStep from '@onboarding-views/steps/Skip';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover';
import FirmwareStep from '@onboarding-views/steps/Firmware';
import ResetDeviceStep from '@suite/views/onboarding/steps/ResetDevice';
import RecoveryStep from '@onboarding-views/steps/Recovery';
import BackupStep from '@onboarding-views/steps/Backup';
import SecurityStep from '@onboarding-views/steps/Security';
import SetPinStep from '@onboarding-views/steps/Pin';
import FinalStep from '@onboarding-views/steps/Final';
import UnexpectedState from '@onboarding-views/unexpected-states';

const Onboarding = () => {
    const { activeStepId, path } = useOnboarding();

    const getStep = () => {
        const lookup = steps.find((step: Step) => step.id === activeStepId);
        // todo: maybe get rid of this with stricter typescript
        if (!lookup) {
            throw new TypeError('step not found by step id. unexpected.');
        }
        return lookup;
    };

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
            case STEP.ID_SKIP_STEP:
                return SkipStep;
            case STEP.ID_SECURITY_STEP:
                // Security intro (BACKUP, PIN), option to skip them
                return SecurityStep;
            case STEP.ID_BACKUP_STEP:
                // Seed backup
                return BackupStep;
            case STEP.ID_SET_PIN_STEP:
                // Pin setup
                return SetPinStep;
            case STEP.ID_FINAL_STEP:
                return FinalStep;
            default:
                console.error('no corresponding component found');
                return () => null;
        }
    };

    const StepComponent = getStepComponent();
    const stepsInPath = steps.filter(s => s.progress && isStepInPath(s, path));

    // TODO global unexpected states
    // TODO Maybe put Onboarding layout here instead of defining it in each step
    return (
        <>
            {/* <UnexpectedState> */}
            {/* {modal && <InnerModalWrapper>{modal}</InnerModalWrapper>} */}
            {/* {modal} */}
            <StepComponent />
            {/* </UnexpectedState> */}
        </>
    );
};

export default Onboarding;
