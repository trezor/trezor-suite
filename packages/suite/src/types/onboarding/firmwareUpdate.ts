import { setProgress, updateFirmware } from '@suite/actions/onboarding/firmwareUpdateActions';

export interface FirmwareUpdateReducer {
    progress: number;
}

export interface FirmwareUpdateActions {
    setProgress: typeof setProgress;
    updateFirmware: typeof updateFirmware;
}

export const SET_PROGRESS = '@onboarding/firmware-update-set-progress';

interface SetProgressAction {
    type: typeof SET_PROGRESS;
    progress: number;
}

export type FirmwareUpdateActionTypes = SetProgressAction;
