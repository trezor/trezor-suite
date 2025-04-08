import { DeviceModelInternal } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { ProgressBarStep, Step } from 'src/types/onboarding';

const commonPrerequisites: Step['prerequisites'] = [
    'transport-bridge',
    'device-bootloader',
    'device-seedless',
    'device-unacquired',
    'device-unknown',
    'device-unreadable',
    'device-disconnected',
];

const afterInitializePrerequisites: Step['prerequisites'] = [
    'device-initialize',
    'device-recovery-mode',
    'device-different',
];

export const progressBarSteps: ProgressBarStep[] = [
    {
        key: 'device',
        labelTranslationId: 'TR_DEVICE',
    },
    {
        key: 'wallet',
        labelTranslationId: 'TR_ONBOARDING_STEP_WALLET',
    },
    {
        key: 'pin',
        labelTranslationId: 'TR_PIN',
    },
    {
        key: 'coins',
        labelTranslationId: 'TR_COINS',
    },
    {
        key: 'final',
    },
];

export const steps: Step[] = [
    {
        id: STEP.ID_FIRMWARE_STEP,
        stepGroup: 'device',
        prerequisites: [
            'transport-bridge',
            'device-seedless',
            'device-unacquired',
            'device-unknown',
            'device-unreadable',
            'device-recovery-mode',
            'device-different',
            // Device disconnection is handled separately in Firmware components, as disconnecting the device is essential part of the fw update process
        ],
    },
    {
        id: STEP.ID_AUTHENTICATE_DEVICE_STEP,
        stepGroup: 'device',
        supportedModels: [
            DeviceModelInternal.T2B1,
            DeviceModelInternal.T3B1,
            DeviceModelInternal.T3T1,
            DeviceModelInternal.T3W1,
        ],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_TUTORIAL_STEP,
        stepGroup: 'device',
        supportedModels: [
            DeviceModelInternal.T2B1,
            DeviceModelInternal.T3B1,
            { model: DeviceModelInternal.T3T1, minFwVersion: '2.8.0' },
            DeviceModelInternal.T3W1,
        ],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_CREATE_OR_RECOVER,
        stepGroup: 'wallet',
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_RESET_DEVICE_STEP,
        stepGroup: 'wallet',
        path: [STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_RECOVERY_STEP,
        stepGroup: 'wallet',
        path: [STEP.PATH_RECOVERY],
        prerequisites: [
            ...commonPrerequisites,
            // watch out: 'device-different' cannot be used here! recovery is changing device_id
        ],
    },
    {
        id: STEP.ID_SECURITY_STEP,
        stepGroup: 'wallet',
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_BACKUP_STEP,
        stepGroup: 'wallet',
        path: [STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_SET_PIN_STEP,
        stepGroup: 'pin',
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_COINS_STEP,
        stepGroup: 'coins',
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
        hideForBitcoinOnly: true,
    },
    {
        id: STEP.ID_FINAL_STEP,
        stepGroup: 'final',
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
];
