import {
    SET_PROGRESS,
    FirmwareUpdateReducer,
    FirmwareUpdateActionTypes,
} from '@suite/types/onboarding/firmwareUpdate';

const initialState = {
    progress: 0,
};

const firmwareUpdate = (
    state: FirmwareUpdateReducer = initialState,
    action: FirmwareUpdateActionTypes,
): FirmwareUpdateReducer => {
    switch (action.type) {
        case SET_PROGRESS:
            return {
                ...state,
                progress: action.progress,
            };
        default:
            return state;
    }
};

export default firmwareUpdate;
