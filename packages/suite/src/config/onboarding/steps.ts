import { Step } from '@onboarding-types';

import * as STEP from '@onboarding-constants/steps';

const steps: Step[] = [
    {
        id: STEP.ID_WELCOME_STEP,
        buy: true,
        help: false,
        progress: false,
        disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE],
    },
    {
        id: STEP.ID_FIRMWARE_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            // STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_SKIP_STEP,
        buy: true,
        help: false,
        progress: false,
        disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE],
    },
    {
        id: STEP.ID_CREATE_OR_RECOVER,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: true,
        help: true,
        progress: true,
        disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE],
    },
    {
        id: STEP.ID_NEW_OR_USED,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: true,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_SELECT_DEVICE_STEP,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW],
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        buy: true,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_UNBOXING_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW],
        buy: true,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_PAIR_DEVICE_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: true,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_RESET_DEVICE_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_RECOVERY_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            // watch out: cannot be used here! recovery is changing device_id
            // STEP.DISALLOWED_IS_NOT_SAME_DEVICE
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_SECURITY_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_BACKUP_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_SET_PIN_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
        buy: false,
        help: true,
        progress: true,
    },
    {
        id: STEP.ID_FINAL_STEP,
        buy: false,
        help: false,
        progress: true,
    },
];

export default steps;
