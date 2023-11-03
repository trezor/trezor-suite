import { DeviceModelInternal } from '@trezor/connect';
import * as STEP from 'src/constants/onboarding/steps';
import { PrerequisiteType } from 'src/utils/suite/prerequisites';

export interface Step {
    id: AnyStepId;
    stepGroup: number | undefined;
    prerequisites?: (PrerequisiteType | 'device-different')[];
    path?: AnyPath[];
    supportedModels?: DeviceModelInternal[];
}

// todo: remove, improve typing
export type AnyStepId =
    | typeof STEP.ID_CREATE_OR_RECOVER
    | typeof STEP.ID_BACKUP_STEP
    | typeof STEP.ID_FINAL_STEP
    | typeof STEP.ID_FIRMWARE_STEP
    | typeof STEP.ID_AUTHENTICATE_DEVICE_STEP
    | typeof STEP.ID_TUTORIAL_STEP
    | typeof STEP.ID_SET_PIN_STEP
    | typeof STEP.ID_SECURITY_STEP
    | typeof STEP.ID_RESET_DEVICE_STEP
    | typeof STEP.ID_RECOVERY_STEP
    | typeof STEP.ID_COINS_STEP;

export type AnyPath = typeof STEP.PATH_CREATE | typeof STEP.PATH_RECOVERY;
