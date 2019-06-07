import * as STEP from '@suite/constants/onboarding/steps';

export interface Step {
    id: AnyStepId;
    title?: AnyStepTitle;
    disallowedDeviceStates?: AnyStepDisallowedState[];
    visited?: boolean; // todo: might not be used
    resolved?: boolean; // todo: might not be used
}

export type AnyStepId =
    | typeof STEP.ID_INIT_DEVICE
    | typeof STEP.ID_BACKUP_STEP
    | typeof STEP.ID_BOOKMARK_STEP
    | typeof STEP.ID_BRIDGE_STEP
    | typeof STEP.ID_FINAL_STEP
    | typeof STEP.ID_FIRMWARE_STEP
    | typeof STEP.ID_HOLOGRAM_STEP
    | typeof STEP.ID_NEWSLETTER_STEP
    | typeof STEP.ID_SELECT_DEVICE_STEP
    | typeof STEP.ID_SET_PIN_STEP
    | typeof STEP.ID_START_STEP
    | typeof STEP.ID_SECURITY_STEP
    | typeof STEP.ID_WELCOME_STEP
    | typeof STEP.ID_NAME_STEP
    | typeof STEP.ID_CONNECT_STEP
    | typeof STEP.ID_UNBOXING_STEP
    | typeof STEP.ID_RECOVERY_STEP;

export type AnyStepDisallowedState =
    | typeof STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER
    | typeof STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED
    | typeof STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE
    | typeof STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN
    | typeof STEP.DISALLOWED_IS_NOT_SAME_DEVICE;

export type AnyStepTitle =
    | typeof TITLE_INIT_DEVICE
    | typeof TITLE_BACKUP_STEP
    | typeof TITLE_BOOKMARK_STEP
    | typeof TITLE_BRIDGE_STEP
    | typeof TITLE_FINAL_STEP
    | typeof TITLE_FIRMWARE_STEP
    | typeof TITLE_HOLOGRAM_STEP
    | typeof TITLE_NEWSLETTER_STEP
    | typeof TITLE_SELECT_DEVICE_STEP
    | typeof TITLE_SET_PIN_STEP
    | typeof TITLE_START_STEP
    | typeof TITLE_SECURITY_STEP
    | typeof TITLE_WELCOME_STEP
    | typeof TITLE_NAME_STEP
    | typeof TITLE_CONNECT_STEP
    | typeof TITLE_UNBOXING_STEP
    | typeof TITLE_RECOVERY_STEP;
