import {
    deviceActions,
    discoveryActions,
    selectDeviceModel,
    selectDeviceFirmwareVersion,
    authorizeDeviceThunk,
    accountsActions,
} from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isFirmwareVersionSupported } from '@suite-native/device';

import { startDescriptorPreloadedDiscoveryThunk, discoveryCheckThunk } from './discoveryThunks';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from './discoveryConfigSlice';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (deviceActions.forgetDevice.match(action) && action.payload.device.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.device.state));
        }

        const deviceModel = selectDeviceModel(getState());
        const deviceFwVersion = selectDeviceFirmwareVersion(getState());
        const areTestnetsEnabled = selectAreTestnetsEnabled(getState());

        const isDeviceFirmwareVersionSupported = isFirmwareVersionSupported(
            deviceFwVersion,
            deviceModel,
        );

        // If user enables testnets discovery, run discovery with testnets enabled.
        if (
            toggleAreTestnetsEnabled.match(action) &&
            !areTestnetsEnabled &&
            isDeviceFirmwareVersionSupported
        ) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    forcedAreTestnetsEnabled: areTestnetsEnabled,
                }),
            );
        }

        // We need to wait until `authorizeDeviceThunk` action is fulfilled, because we need
        // to know the device state when starting discovery of newly authorized device.
        next(action);

        // On successful authorization, create discovery instance and run it with received device state.
        if (authorizeDeviceThunk.fulfilled.match(action) && isDeviceFirmwareVersionSupported) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    forcedDeviceState: action.payload.state,
                }),
            );
        }

        // for further continual discovery check for various other reasons
        if (
            deviceActions.selectDevice.match(action) || // user switched device
            deviceActions.receiveAuthConfirm.match(action) || // user confirmed device auth
            accountsActions.changeAccountVisibility.match(action) // account visibility changed - e.g. when incoming txn to hidden account
        ) {
            dispatch(discoveryCheckThunk());
        }

        return action;
    },
);
