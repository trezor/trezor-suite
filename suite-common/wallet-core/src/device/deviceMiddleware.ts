import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';

import {
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
} from './deviceThunks';
import { deviceActions } from './deviceActions';

export const isActionDeviceRelated = (action: AnyAction): boolean => {
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
    (action, { next, dispatch, extra }) => {
        const {
            actionTypes: { setDeviceMetadata },
        } = extra;
        // propagate action to reducers
        next(action);

        if (deviceActions.createDeviceInstance.match(action)) {
            dispatch(selectDeviceThunk(action.payload));
        }

        if (deviceActions.forgetDevice.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload));
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (action.type === DEVICE.DISCONNECT) {
            dispatch(forgetDisconnectedDevices(action.payload));
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

        if (isActionDeviceRelated(action) || action.type === setDeviceMetadata) {
            // keep suite reducer synchronized with other reducers (selected device)
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
