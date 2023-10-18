import { deviceActions, selectDevice, discoveryActions } from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { startDescriptorPreloadedDiscoveryThunk } from './discoveryThunks';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (deviceActions.forgetDevice.match(action) && action.payload.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.state));
        }

        const device = selectDevice(getState());

        // On successful authorization, create discovery instance and run.
        if (deviceActions.authDevice.match(action) && device) {
            dispatch(
                startDescriptorPreloadedDiscoveryThunk({
                    deviceState: action.payload.state,
                    device,
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
