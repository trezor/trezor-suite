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
    runAdditionalDiscoveryThunk,
    selectSelectedDevice,
    selectShouldRediscoverNetworks,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import {
    createAndBackupWalletThunk,
    isDeviceEventAction,
    recoverWalletThunk,
    selectIsDeviceFirmwareSupported,
} from '@suite-native/device';
import {
    removeDeviceFromEjectedList,
    selectHasDeviceBeenEjectedDuringDiscovery,
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

        if (
            startDiscoveryThunk.pending.match(action) ||
            runAdditionalDiscoveryThunk.pending.match(action)
        ) {
            const selectedDevice = selectSelectedDevice(getState());
            dispatch(removeDeviceFromEjectedList(selectedDevice?.id));
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
            isDeviceEventAction(action, DEVICE.CONNECT) ||
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
                    const shouldRediscover = selectShouldRediscoverNetworks(
                        getState(),
                        device.state.staticSessionId,
                    );

                    // If device is reconnected after ejecting during discovery, restart the discovery process
                    const isConnectActionAndHasBeenEjectedDuringDiscovery =
                        isDeviceEventAction(action, DEVICE.CONNECT) &&
                        selectHasDeviceBeenEjectedDuringDiscovery(getState(), action.payload.id);

                    if (shouldRediscover || isConnectActionAndHasBeenEjectedDuringDiscovery) {
                        dispatch(restartDiscoveryThunk());
                    }
                }
            }
        }

        return action;
    },
);
