import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { Step, StepCategory } from 'src/types/onboarding';

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

export const stepCategories: StepCategory[] = [
    {
        id: 'device',
        labelTranslationId: 'TR_DEVICE',
        steps: [
            {
                id: STEP.ID_FIRMWARE_STEP,
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
                supportedModels: [
                    DeviceModelInternal.T2B1,
                    DeviceModelInternal.T3B1,
                    { model: DeviceModelInternal.T3T1, minFwVersion: '2.8.0' },
                    DeviceModelInternal.T3W1,
                ],
                prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
            },
        ],
    },
    {
        id: 'wallet',
        labelTranslationId: 'TR_ONBOARDING_STEP_WALLET',
        steps: [
            {
                id: STEP.ID_CREATE_OR_RECOVER,
                path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
                prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
            },
            {
                id: STEP.ID_RESET_DEVICE_STEP,
                path: [STEP.PATH_CREATE],
                prerequisites: [...commonPrerequisites, 'device-recovery-mode', 'device-different'],
            },
            {
                id: STEP.ID_RECOVERY_STEP,
                path: [STEP.PATH_RECOVERY],
                prerequisites: [
                    ...commonPrerequisites,
                    // watch out: 'device-different' cannot be used here! recovery is changing device_id
                ],
            },
            {
                id: STEP.ID_SECURITY_STEP,
                path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
                prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
            },
            {
                id: STEP.ID_BACKUP_STEP,
                path: [STEP.PATH_CREATE],
                prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
            },
        ],
    },
    {
        id: 'pin',
        labelTranslationId: 'TR_PIN',
        steps: [
            {
                id: STEP.ID_SET_PIN_STEP,
                path: [STEP.PATH_RECOVERY, STEP.PATH_CREATE],
                prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
            },
        ],
    },
    {
        id: 'coins',
        labelTranslationId: 'TR_COINS',
        steps: [
            {
                id: STEP.ID_COINS_STEP,
                prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
                supportedFirmwareTypes: [FirmwareType.Regular],
            },
        ],
    },
    {
        id: 'final',
        steps: [
            {
                id: STEP.ID_FINAL_STEP,
                prerequisites: [...commonPrerequisites, ...afterInitializePrerequisites],
            },
        ],
    },
];
