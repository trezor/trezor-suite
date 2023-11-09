import {
    deviceActions,
    selectDevice,
    discoveryActions,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
} from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isFirmwareVersionSupported } from '@suite-native/device';

import { startDescriptorPreloadedDiscoveryThunk } from './discoveryThunks';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from './discoveryConfigSlice';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (deviceActions.forgetDevice.match(action) && action.payload.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.state));
        }

        const device = selectDevice(getState());
        const deviceModel = selectDeviceModel(getState());
        const deviceFirmwareVersion = selectDeviceFirmwareVersion(getState());

        const areTestnetsEnabled = selectAreTestnetsEnabled(getState());

        const isDeviceFirmwareVersionSupported = isFirmwareVersionSupported(
            deviceFirmwareVersion,
            deviceModel,
        );

        // On successful authorization, create discovery instance and run.
        if (deviceActions.authDevice.match(action) && device) {
            if (isDeviceFirmwareVersionSupported) {
                dispatch(
                    startDescriptorPreloadedDiscoveryThunk({
                        deviceState: action.payload.state,
                        device,
                        areTestnetsEnabled,
                    }),
                );
            }
        }

        // If user enables testnets discovery, run it.
        if (toggleAreTestnetsEnabled.match(action) && !areTestnetsEnabled && device?.state) {
            if (isDeviceFirmwareVersionSupported) {
                dispatch(
                    startDescriptorPreloadedDiscoveryThunk({
                        deviceState: device.state,
                        device,
                        areTestnetsEnabled: true,
                    }),
                );
            }
        }

        return next(action);
    },
);
