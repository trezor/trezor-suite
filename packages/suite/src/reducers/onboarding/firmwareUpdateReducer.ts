import produce from 'immer';

import {
    SET_FIRMWARE,
    SET_ERROR,
    SET_UPDATE_STATUS,
    FirmwareUpdateReducer,
    FirmwareUpdateActionTypes,
} from '@onboarding-types/firmwareUpdate';

const initialState = {
    error: null,
    firmware: null,
    status: null,
};

const firmwareUpdate = (
    state: FirmwareUpdateReducer = initialState,
    action: FirmwareUpdateActionTypes,
) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_ERROR:
                draft.error = action.value;
                break;
            case SET_FIRMWARE:
                draft.firmware = action.value;
                break;
            case SET_UPDATE_STATUS:
                draft.status = action.value;
                break;
            default:
                return state;
        }
    });
};

export default firmwareUpdate;
