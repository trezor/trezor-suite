import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    accountsActions,
    changeCoinVisibility,
    changeNetworks,
    discoveryActions,
    selectIsAnyNetworkEnabled,
    selectIsBitcoinEnabled,
    selectShouldRediscover,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import {
    createAndBackupWalletThunk,
    recoverWalletThunk,
    selectIsDeviceFirmwareSupported,
} from '@suite-native/device';
import { DEVICE } from '@trezor/connect';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (
            deviceActions.forgetDevice.match(action) &&
            action.payload.device.state?.staticSessionId
        ) {
            dispatch(discoveryActions.deleteDiscovery(action.payload.device.path));
        }

        // We need to wait until `authorizeDeviceThunk` action is fulfilled, because we need
        // to know the device state when starting discovery of newly authorized device.
        next(action);

        const isDeviceFirmwareVersionSupported = selectIsDeviceFirmwareSupported(getState());
        const isAnyNetworkEnabled = selectIsAnyNetworkEnabled(getState());
        const isBitcoinEnabled = selectIsBitcoinEnabled(getState());

        // ensure that BTC is enabled when device with BTC-only firmware is connected
        // (it could have been disabled via some other device with universal firmware)
        if (deviceActions.selectDevice.match(action)) {
            const device = action.payload;
            if (device?.connected && hasBitcoinOnlyFirmware(device)) {
                if (!isBitcoinEnabled) {
                    dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: true }));
                }
            }
        }

        // if we changed enabled networks, check for token definitions right away
        if (changeNetworks.match(action)) {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }

        if (
            action.type === DEVICE.CONNECT ||
            deviceActions.selectDevice.match(action) ||
            changeCoinVisibility.fulfilled.match(action) ||
            accountsActions.updateAccount.match(action) || // empty account can become nonempty
            accountsActions.changeAccountVisibility.match(action) ||
            createAndBackupWalletThunk.fulfilled.match(action) ||
            recoverWalletThunk.fulfilled.match(action)
        ) {
            const device = selectSelectedDevice(getState());
            if (
                isAnyNetworkEnabled &&
                isDeviceFirmwareVersionSupported &&
                device &&
                device.connected &&
                isDeviceAcquired(device)
            ) {
                const shouldRediscover = selectShouldRediscover(getState(), device);
                if (shouldRediscover) {
                    dispatch(startOrRestartDiscoveryThunk());
                }
            }
        }

        return action;
    },
);
