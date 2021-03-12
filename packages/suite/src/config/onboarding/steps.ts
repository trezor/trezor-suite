import { Step } from '@onboarding-types';
import * as STEP from '@onboarding-constants/steps';

const steps: Step[] = [
    {
        id: STEP.ID_WELCOME_STEP,
        stepGroup: undefined,
        disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE],
    },
    {
        id: STEP.ID_FIRMWARE_STEP,
        stepGroup: 0,
        disallowedDeviceStates: [
            // Device disconnection is handled separately in Firmware components, as disconnecting the device is essential part of the fw update process
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            // STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
    },
    {
        id: STEP.ID_CREATE_OR_RECOVER,
        stepGroup: 1,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
        ],
    },
    {
        id: STEP.ID_RESET_DEVICE_STEP,
        stepGroup: 1,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_CREATE],
    },
    {
        id: STEP.ID_RECOVERY_STEP,
        stepGroup: 1,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            // watch out: cannot be used here! recovery is changing device_id
            // STEP.DISALLOWED_IS_NOT_SAME_DEVICE
        ],
        path: [STEP.PATH_RECOVERY],
    },
    {
        id: STEP.ID_SECURITY_STEP,
        stepGroup: 1,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
    },
    {
        id: STEP.ID_BACKUP_STEP,
        stepGroup: 1,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_CREATE],
    },
    {
        id: STEP.ID_SET_PIN_STEP,
        stepGroup: 2,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
    },
    {
        id: STEP.ID_COINS_STEP,
        stepGroup: 3,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
    },
    {
        id: STEP.ID_FINAL_STEP,
        stepGroup: 4,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE,
        ],
    },
];

export default steps;
