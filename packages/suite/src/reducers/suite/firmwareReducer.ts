import produce from 'immer';

import {
    SET_UPDATE_STATUS,
    FirmwareUpdateReducer,
    FirmwareUpdateActionTypes,
} from '@suite-actions/firmwareActions';
import { SUITE } from '@suite-actions/constants';

const initialState = {
    status: null,
};

const handleDeviceChange = (device, state, draft) => {
    if (!device || device.type !== 'acquired') {
        return;
    }

    // reset to initial state after device reconnect;
    // todo: write tests and implement same deviceId logic
    if (state.status === 'restarting') {
        return (draft.status = null);
    }
};

const firmwareUpdate = (
    state: FirmwareUpdateReducer = initialState,
    action: FirmwareUpdateActionTypes,
) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_UPDATE_STATUS:
                draft.status = action.payload;
                break;
            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                handleDeviceChange(action.payload, state, draft);
                break;
            default:
        }
    });
};

export default firmwareUpdate;
