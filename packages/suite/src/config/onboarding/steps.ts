import { Step } from '@onboarding-types/steps';

import * as STEP from '@onboarding-constants/steps';

const steps: Step[] = [
    {
        id: STEP.ID_WELCOME_STEP,
    },
    {
        id: STEP.ID_CREATE_OR_RECOVER,
        // todo
        title: STEP.TITLE_SELECT_DEVICE_STEP,
        // todo
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_NEW_OR_USED,
        title: STEP.TITLE_SELECT_DEVICE_STEP,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_SELECT_DEVICE_STEP,
        title: STEP.TITLE_SELECT_DEVICE_STEP,
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW],
    },
    {
        id: STEP.ID_UNBOXING_STEP,
        title: STEP.TITLE_SELECT_DEVICE_STEP,
        disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW],
    },
    {
        id: STEP.ID_PAIR_DEVICE_STEP,
        title: STEP.TITLE_PAIR_DEVICE_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_FIRMWARE_STEP,
        title: STEP.TITLE_FIRMWARE_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            // STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_SHAMIR_STEP,
        title: STEP.TITLE_LAUNCH_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_RECOVERY_STEP,
        title: STEP.TITLE_LAUNCH_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_SECURITY_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_BACKUP_STEP,
        title: STEP.TITLE_BACKUP_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_SET_PIN_STEP,
        title: STEP.TITLE_SET_PIN_STEP,
        disallowedDeviceStates: [
            STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
            STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
            STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
        ],
        path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE, STEP.PATH_NEW, STEP.PATH_USED],
    },
    {
        id: STEP.ID_FINAL_STEP,
    },
];

export default (steps => {
    if (process.env.SUITE_TYPE === 'desktop') {
        return steps.filter(s => s.id !== STEP.ID_BOOKMARK_STEP);
    }
    return steps;
})(steps);
