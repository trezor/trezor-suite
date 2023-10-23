import { deviceActions, selectDevice, discoveryActions } from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { startDescriptorPreloadedDiscoveryThunk } from './discoveryThunks';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from './discoveryConfigSlice';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (deviceActions.forgetDevice.match(action) && action.payload.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.state));
        }

        const device = selectDevice(getState());

        const areTestnetsEnabled = selectAreTestnetsEnabled(getState());

        // On successful authorization, create discovery instance and run.
        if (deviceActions.authDevice.match(action) && device) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    deviceState: action.payload.state,
                    device,
                    areTestnetsEnabled,
                }),
            );
        }

        // If user enables testnets discovery, run it.
        if (toggleAreTestnetsEnabled.match(action) && !areTestnetsEnabled && device?.state) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    deviceState: device.state,
                    device,
                    areTestnetsEnabled: true,
                }),
            );
        }

        // Update discovery for pass-phrased wallets.
        if (deviceActions.receiveAuthConfirm.match(action) && action.payload.device.state) {
            dispatch(
                discoveryActions.updateDiscovery({
                    deviceState: action.payload.device.state,
                    authConfirm: false,
                }),
            );
        }

        return next(action);
    },
);
