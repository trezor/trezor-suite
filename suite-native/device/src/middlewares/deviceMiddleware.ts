import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';
import {
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';

import { wipeDisconnectedDevicesDataThunk } from '../deviceThunks';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.authDevice,
            deviceActions.authFailed,
            deviceActions.selectDevice,
            deviceActions.receiveAuthConfirm,
            deviceActions.updatePassphraseMode,
            deviceActions.addButtonRequest,
            deviceActions.removeButtonRequests,
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

        if (deviceActions.forgetDevice.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload));
        }

        const isUsbDeviceConnectFeatureEnabled = selectIsFeatureFlagEnabled(
            getState(),
            FeatureFlag.IsDeviceConnectEnabled,
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
                dispatch(wipeDisconnectedDevicesDataThunk());
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
