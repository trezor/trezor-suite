import produce from 'immer';

import { SUITE, FIRMWARE } from '@suite-actions/constants';
import { DEVICE, Device } from 'trezor-connect';
import { TrezorDevice, Action } from '@suite-types';

const INITIAL = 'initial';
const STARTED = 'started';
const DOWNLOADING = 'downloading';
const INSTALLING = 'installing';
const DONE = 'done';
const RESTARTING = 'restarting';
const ERROR = 'error';

export type AnyStatus =
    | typeof INITIAL
    | typeof STARTED
    | typeof DOWNLOADING
    | typeof INSTALLING
    | typeof RESTARTING
    | typeof ERROR
    | typeof DONE;

export interface FirmwareUpdateState {
    reducerEnabled: boolean;
    status: AnyStatus;
    device?: Device;
}

const initialState: FirmwareUpdateState = {
    // reducerEnabled means that reducer is listening for actions.
    reducerEnabled: false,
    status: INITIAL,
    device: undefined,
};

const handleSelectDevice = (draft: FirmwareUpdateState, device?: TrezorDevice) => {
    const prevDevice = draft.device;

    // should not happen but who knows.
    if (!device || !device.features || device.mode === 'bootloader') {
        return;
    }

    // remain inactive until we have prev device disconnected in bootloader
    if (!prevDevice || !prevDevice.features || prevDevice.mode !== 'bootloader') {
        return;
    }

    // there is prev device in bootloader and current status is restarting, so lets
    // assume that the reconnected device is the same device and show success screen
    if (draft.status === 'restarting') {
        return (draft.status = 'done');
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
                break;
            case DEVICE.DISCONNECT:
                draft.device = action.payload;
                break;
            case SUITE.SELECT_DEVICE:
                // draft.device = action.payload;
                handleSelectDevice(draft, action.payload);
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
