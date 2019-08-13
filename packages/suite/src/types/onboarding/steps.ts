import * as STEP from '@suite/constants/onboarding/steps';

export interface Step {
    id: AnyStepId;
    title?: AnyStepTitle;
    disallowedDeviceStates?: AnyStepDisallowedState[];
    visited?: boolean; // todo: might not be used
    resolved?: boolean; // todo: might not be used
    path?: AnyPath[];
}

export type AnyStepId =
    | typeof STEP.ID_INIT_DEVICE
    | typeof STEP.ID_BACKUP_STEP
    | typeof STEP.ID_BOOKMARK_STEP
    | typeof STEP.ID_BRIDGE_STEP
    | typeof STEP.ID_NEW_OR_USED
    | typeof STEP.ID_FINAL_STEP
    | typeof STEP.ID_FIRMWARE_STEP
    | typeof STEP.ID_NEWSLETTER_STEP
    | typeof STEP.ID_SELECT_DEVICE_STEP
    | typeof STEP.ID_SET_PIN_STEP
    | typeof STEP.ID_SECURITY_STEP
    | typeof STEP.ID_WELCOME_STEP
    | typeof STEP.ID_NAME_STEP
    | typeof STEP.ID_CONNECT_STEP
    | typeof STEP.ID_UNBOXING_STEP
    | typeof STEP.ID_SHAMIR_STEP
    | typeof STEP.ID_RECOVERY_STEP;

export type AnyStepDisallowedState =
    | typeof STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER
    | typeof STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED
    | typeof STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE
    | typeof STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN
    | typeof STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE
    | typeof STEP.DISALLOWED_IS_NOT_SAME_DEVICE;

export type AnyStepTitle =
    | typeof STEP.TITLE_INIT_DEVICE
    | typeof STEP.TITLE_BACKUP_STEP
    | typeof STEP.TITLE_BOOKMARK_STEP
    | typeof STEP.TITLE_BRIDGE_STEP
    | typeof STEP.TITLE_FINAL_STEP
    | typeof STEP.TITLE_FIRMWARE_STEP
    | typeof STEP.TITLE_NEWSLETTER_STEP
    | typeof STEP.TITLE_SELECT_DEVICE_STEP
    | typeof STEP.TITLE_SET_PIN_STEP
    | typeof STEP.TITLE_SECURITY_STEP
    | typeof STEP.TITLE_WELCOME_STEP
    | typeof STEP.TITLE_NAME_STEP
    | typeof STEP.TITLE_CONNECT_STEP
    | typeof STEP.TITLE_UNBOXING_STEP
    | typeof STEP.TITLE_LAUNCH_STEP
    | typeof STEP.TITLE_RECOVERY_STEP;

export type AnyPath =
    | typeof STEP.PATH_CREATE
    | typeof STEP.PATH_RECOVERY
    | typeof STEP.PATH_NEW
    | typeof STEP.PATH_USED;
