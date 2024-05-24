import {
    deviceActions,
    selectDevice,
    discoveryActions,
    selectDeviceModel,
    selectDeviceFirmwareVersion,
    authorizeDeviceThunk,
} from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isFirmwareVersionSupported } from '@suite-native/device';

import { startDescriptorPreloadedDiscoveryThunk } from './discoveryThunks';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from './discoveryConfigSlice';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (deviceActions.forgetDevice.match(action) && action.payload.device.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.device.state));
        }

        const device = selectDevice(getState());
        const deviceModel = selectDeviceModel(getState());
        const deviceFwVersion = selectDeviceFirmwareVersion(getState());

        const areTestnetsEnabled = selectAreTestnetsEnabled(getState());

        const isDeviceFirmwareVersionSupported = isFirmwareVersionSupported(
            deviceFwVersion,
            deviceModel,
        );

        // If user enables testnets discovery, run it.
        if (toggleAreTestnetsEnabled.match(action) && !areTestnetsEnabled && device?.state) {
            if (isDeviceFirmwareVersionSupported) {
                dispatch(
                    startDescriptorPreloadedDiscoveryThunk({
                        deviceState: device.state,
                        areTestnetsEnabled: true,
                    }),
                );
            }
        }

        // We need to wait until `authorizeDeviceThunk` action is fulfilled, because we need
        // to know the device state when starting discovery of newly authorized device.
        next(action);

        // On successful authorization, create discovery instance and run it.
        if (authorizeDeviceThunk.fulfilled.match(action) && isDeviceFirmwareVersionSupported) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    deviceState: action.payload.state,
                    areTestnetsEnabled,
                }),
            );
        }

        return action;
    },
);
