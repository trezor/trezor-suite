import produce from 'immer';
import { DEVICE, UI, Device } from 'trezor-connect';

import { SUITE } from '@suite-actions/constants';
import { FIRMWARE } from '@settings-actions/constants';
import { TrezorDevice, Action } from '@suite-types';

const INITIAL = 'initial';
const STARTED = 'started';
const DOWNLOADING = 'downloading';
const WAITING_FOR_CONFIRMATION = 'waiting-for-confirmation';
const INSTALLING = 'installing';
const DONE = 'done';
const RESTARTING = 'restarting';
const ERROR = 'error';

export type AnyStatus =
    | typeof INITIAL
    | typeof STARTED
    | typeof DOWNLOADING
    | typeof WAITING_FOR_CONFIRMATION
    | typeof INSTALLING
    | typeof RESTARTING
    | typeof ERROR
    | typeof DONE;

export interface FirmwareUpdateState {
    reducerEnabled: boolean;
    status: AnyStatus;
    device?: Device;
    installingProgress?: number;
    error?: string;
}

const initialState: FirmwareUpdateState = {
    // reducerEnabled means that reducer is listening for actions.
    reducerEnabled: false,
    status: INITIAL,
    device: undefined,
    installingProgress: undefined,
    error: undefined,
};

const handleSelectDevice = (draft: FirmwareUpdateState, device?: TrezorDevice) => {
    const prevDevice = draft.device;

    // should not happen but who knows.
    if (!device) {
        return;
    }

    if (draft.status === 'restarting') {
        // remain inactive until we have prev device disconnected in bootloader
        if (!prevDevice || !prevDevice.features || prevDevice.mode !== 'bootloader') {
            return;
        }
        // there is prev device in bootloader and current status is restarting, so lets
        // assume that the reconnected device is the same device and show success screen
        draft.status = 'done';
    }
};

const firmwareUpdate = (state: FirmwareUpdateState = initialState, action: Action) => {
    if (
        !state.reducerEnabled &&
        ![FIRMWARE.RESET_REDUCER, FIRMWARE.ENABLE_REDUCER].includes(action.type)
    ) {
        return state;
    }

    return produce(state, draft => {
        switch (action.type) {
            case FIRMWARE.SET_UPDATE_STATUS:
                draft.status = action.payload;
                if (action.payload === 'started') {
                    // reset
                    draft.installingProgress = undefined;
                }
                break;
            case FIRMWARE.SET_ERROR:
                draft.status = 'error';
                draft.error = action.payload;
                break;
            case DEVICE.DISCONNECT:
                draft.device = action.payload;
                break;
            case SUITE.SELECT_DEVICE:
                // draft.device = action.payload;
                handleSelectDevice(draft, action.payload);
                break;
            case UI.REQUEST_BUTTON:
                if (action.payload && action.payload.code === 'ButtonRequest_FirmwareUpdate') {
                    draft.status = 'waiting-for-confirmation';
                }
                break;
            case UI.FIRMWARE_PROGRESS:
                // if (!Number.isNaN(action.payload.progress)) {
                draft.installingProgress = action.payload.progress;
                draft.status = 'installing';
                // }
                break;
            case FIRMWARE.ENABLE_REDUCER:
                draft.reducerEnabled = action.payload;
                break;
            case FIRMWARE.RESET_REDUCER:
                return initialState;
            default:
        }
    });
};

export default firmwareUpdate;
