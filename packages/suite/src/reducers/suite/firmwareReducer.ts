import produce, { Draft } from 'immer';

import { FirmwareUpdateReducer } from '@suite-actions/firmwareActions';
import { SUITE, FIRMWARE } from '@suite-actions/constants';
import { TrezorDevice, Action } from '@suite-types';

const initialState = {
    status: null,
};

const handleDeviceChange = (
    state: FirmwareUpdateReducer,
    draft: Draft<FirmwareUpdateReducer>,
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

const firmwareUpdate = (state: FirmwareUpdateReducer = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case FIRMWARE.SET_UPDATE_STATUS:
                draft.status = action.payload;
                break;
            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                handleDeviceChange(state, draft, action.payload);
                break;
            default:
        }
    });
};

export default firmwareUpdate;
