import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    accountsActions,
    changeCoinVisibility,
    changeNetworks,
    deviceActions,
    discoveryActions,
    restartDiscoveryThunk,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import {
    createAndBackupWalletThunk,
    recoverWalletThunk,
    selectIsDeviceFirmwareSupported,
} from '@suite-native/device';
import {
    selectIsCoinEnablingInitFinished,
    setIsCoinEnablingInitFinished,
} from '@suite-native/settings';
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
        const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());

        // ensure that BTC is enabled when device with BTC-only firmware is connected
        // (it could have been disabled via some other device with universal firmware)
        if (deviceActions.selectDevice.match(action)) {
            const device = action.payload;
            if (device?.connected && hasBitcoinOnlyFirmware(device)) {
                dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: true }));
                dispatch(setIsCoinEnablingInitFinished(true));
            }
        }

        // if we changed enabled networks, check for token definitions right away
        if (changeNetworks.match(action) && isCoinEnablingInitFinished) {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }

        if (
            action.type === DEVICE.CONNECT ||
            deviceActions.selectDevice.match(action) ||
            changeCoinVisibility.fulfilled.match(action) ||
            setIsCoinEnablingInitFinished.match(action) ||
            accountsActions.changeAccountVisibility.match(action) ||
            createAndBackupWalletThunk.fulfilled.match(action) ||
            recoverWalletThunk.fulfilled.match(action)
        ) {
            const device = selectSelectedDevice(getState());
            if (
                isCoinEnablingInitFinished &&
                isDeviceFirmwareVersionSupported &&
                device &&
                device.connected &&
                isDeviceAcquired(device)
            ) {
                if (!device?.state) {
                    dispatch(startDiscoveryThunk({}));
                } else if (device.state.staticSessionId) {
                    dispatch(restartDiscoveryThunk());
                }
            }
        }

        return action;
    },
);
