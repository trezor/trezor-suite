import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    changeCoinVisibility,
    changeNetworks,
    deviceActions,
    discoveryActions,
} from '@suite-common/wallet-core';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (
            deviceActions.forgetDevice.match(action) &&
            action.payload.device.state?.staticSessionId
        ) {
            dispatch(discoveryActions.deleteDiscovery(action.payload.device.path));
        }

        const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());

        // We need to wait until `authorizeDeviceThunk` action is fulfilled, because we need
        // to know the device state when starting discovery of newly authorized device.
        next(action);

        // ensure that BTC is enabled when device with BTC-only firmware is connected
        // (it could have been disabled via some other device with universal firmware)
        if (deviceActions.selectDevice.match(action)) {
            const device = action.payload;
            if (device?.connected && hasBitcoinOnlyFirmware(device)) {
                dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: true }));
            }
        }

        // if we changed enabled networks, check for token definitions right away
        if (changeNetworks.match(action) && isCoinEnablingInitFinished) {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }

        return action;
    },
);
