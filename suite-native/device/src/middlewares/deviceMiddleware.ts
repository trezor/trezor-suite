import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';
import {
    authorizeDevice,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { selectIsDeviceConnectFeatureFlagEnabled } from '@suite-native/feature-flags';

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

    return Object.values(DEVICE).includes(action.type);
};

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (action.type === DEVICE.DISCONNECT) {
            dispatch(forgetDisconnectedDevices(action.payload));
        }

        /* The `next` function has to be executed here, because the further dispatched actions of this middleware
         expect that the state was already changed by the action stored in the `action` variable. */
        next(action);

        if (deviceActions.createDeviceInstance.match(action)) {
            dispatch(selectDeviceThunk(action.payload));
        }

        // Request authorization of a newly acquired device.
        if (
            deviceActions.selectDevice.match(action) ||
            deviceActions.updateSelectedDevice.match(action)
        ) {
            dispatch(authorizeDevice({ isUseEmptyPassphraseForced: true }));
        }

        if (
            deviceActions.forgetDevice.match(action) ||
            deviceActions.forgetAndDisconnectDevice.match(action)
        ) {
            dispatch(handleDeviceDisconnect(action.payload));
        }

        const isUsbDeviceConnectFeatureEnabled = selectIsDeviceConnectFeatureFlagEnabled(
            getState(),
        );

        switch (action.type) {
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED:
                if (isUsbDeviceConnectFeatureEnabled) {
                    dispatch(selectDeviceThunk(action.payload));
                }
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
