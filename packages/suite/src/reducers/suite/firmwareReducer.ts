import produce, { Draft } from 'immer';

import { SUITE, FIRMWARE } from '@suite-actions/constants';
import { TrezorDevice, Action } from '@suite-types';

const STARTED = 'started';
const DOWNLOADING = 'downloading';
const INSTALLING = 'installing';
const DONE = 'done';
const RESTARTING = 'restarting';
const ERROR = 'error';

export type AnyStatus =
    | typeof STARTED
    | typeof DOWNLOADING
    | typeof INSTALLING
    | typeof RESTARTING
    | typeof ERROR
    | typeof DONE;

export interface FirmwareUpdateState {
    reducerEnabled: boolean;
    status: null | AnyStatus;
}

const initialState = {
    // reducerEnabled means that reducer is listening for actions.
    reducerEnabled: false,
    status: null,
    // device: null,
};

const handleDeviceChange = (
    state: FirmwareUpdateState,
    draft: Draft<FirmwareUpdateState>,
    device?: TrezorDevice,
) => {
    if (!device || device.type !== 'acquired') {
        return;
    }

    // reset to initial state after device reconnect;
    // todo: write tests and implement same deviceId logic
    if (state.status === 'restarting') {
        return (draft.status = null);
    }
};

const firmwareUpdate = (state: FirmwareUpdateState = initialState, action: Action) => {
    if (
        action.type === SUITE.APP_CHANGE &&
        action.payload === 'firmware' &&
        !state.reducerEnabled
    ) {
        return produce(state, draft => {
            draft.reducerEnabled = true;
        });
    }

    if (action.type === SUITE.APP_CHANGE && action.payload !== 'firmware') {
        return initialState;
    }

    if (!state.reducerEnabled) {
        return state;
    }

    return produce(state, draft => {
        switch (action.type) {
            case FIRMWARE.SET_UPDATE_STATUS:
                draft.status = action.payload;
                break;
            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                // draft.device = action.payload;
                handleDeviceChange(state, draft, action.payload);
                break;
            default:
        }
    });
};

export default firmwareUpdate;
