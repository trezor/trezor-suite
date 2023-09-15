import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';
import {
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
} from '@suite-common/wallet-core';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.authDevice,
            deviceActions.authFailed,
            deviceActions.selectDevice,
            deviceActions.receiveAuthConfirm,
            deviceActions.updatePassphraseMode,
            deviceActions.addButtonRequest,
            deviceActions.rememberDevice,
            deviceActions.forgetDevice,
        )(action)
    ) {
        return true;
    }

    if (Object.values(DEVICE).includes(action.type)) return true;

    return false;
};

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next }) => {
        if (action.type === DEVICE.DISCONNECT) {
            dispatch(forgetDisconnectedDevices(action.payload));
        }

        // propagate action to reducers
        next(action);

        if (deviceActions.createDeviceInstance.match(action)) {
            dispatch(selectDeviceThunk(action.payload));
        }

        if (deviceActions.forgetDevice.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload));
        }

        switch (action.type) {
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED:
                dispatch(handleDeviceConnect(action.payload));
                break;
            case DEVICE.DISCONNECT:
                dispatch(handleDeviceDisconnect(action.payload));
                break;
            default:
                break;
        }

        if (isActionDeviceRelated(action)) {
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
