import type { Step } from 'src/types/onboarding';
import * as STEP from 'src/constants/onboarding/steps';
import { DeviceModelInternal } from '@trezor/connect';

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

const steps: Step[] = [
    {
        id: STEP.ID_WELCOME_STEP,
        stepGroup: undefined,
        prerequisites: [...commonPrerequisites],
    },
    {
        id: STEP.ID_FIRMWARE_STEP,
        stepGroup: 0,
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
        stepGroup: 0,
        supportedModels: [DeviceModelInternal.T2B1],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_TUTORIAL_STEP,
        stepGroup: 0,
        supportedModels: [DeviceModelInternal.T2B1],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_CREATE_OR_RECOVER,
        stepGroup: 1,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_RESET_DEVICE_STEP,
        stepGroup: 1,
        path: [STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
    },
    {
        id: STEP.ID_RECOVERY_STEP,
        stepGroup: 1,
        path: [STEP.PATH_RECOVERY],
        prerequisites: [
            ...commonPrerequisites,
            // watch out: 'device-different' cannot be used here! recovery is changing device_id
        ],
    },
    {
        id: STEP.ID_SECURITY_STEP,
        stepGroup: 1,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_BACKUP_STEP,
        stepGroup: 1,
        path: [STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_SET_PIN_STEP,
        stepGroup: 2,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_COINS_STEP,
        stepGroup: 3,
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
    {
        id: STEP.ID_FINAL_STEP,
        stepGroup: 4,
        prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
    },
];

export default steps;
