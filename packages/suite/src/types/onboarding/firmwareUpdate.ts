import { updateFirmware } from '@suite/actions/onboarding/firmwareUpdateActions';
import { AnyStatus } from '@onboarding-types/firmwareUpdateStatus';

export interface FirmwareUpdateReducer {
    error: null | string;
    firmware: null | ArrayBuffer;
    status: null | AnyStatus;
}

export interface FirmwareUpdateActions {
    updateFirmware: typeof updateFirmware;
}

export const SET_FIRMWARE = '@onboarding/set-firmware';
export const SET_ERROR = '@onboarding/firmware-update-set-error';
export const SET_UPDATE_STATUS = '@onboarding/set-update-status';

interface SetFirmwareAction {
    type: typeof SET_FIRMWARE;
    value: ArrayBuffer | null;
}

interface SetErrorAction {
    type: typeof SET_ERROR;
    value: string | null;
}

interface SetUpdateStatusAction {
    type: typeof SET_UPDATE_STATUS;
    value: AnyStatus;
}

export type FirmwareUpdateActionTypes = SetFirmwareAction | SetErrorAction | SetUpdateStatusAction;
