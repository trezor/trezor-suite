import * as STEP from './onboardingSteps';

export type AnyStepId =
    | typeof STEP.ID_CREATE_OR_RECOVER
    | typeof STEP.ID_BACKUP_STEP
    | typeof STEP.ID_FIRMWARE_STEP
    | typeof STEP.ID_AUTHENTICATE_DEVICE_STEP
    | typeof STEP.ID_TUTORIAL_STEP
    | typeof STEP.ID_SET_PIN_STEP
    | typeof STEP.ID_SECURITY_STEP
    | typeof STEP.ID_RESET_DEVICE_STEP
    | typeof STEP.ID_RECOVERY_STEP
    | typeof STEP.ID_COINS_STEP;

export type AnyPath = typeof STEP.PATH_CREATE | typeof STEP.PATH_RECOVERY;
