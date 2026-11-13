import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import {
    type DeviceRootState,
    deviceActions,
    isTrezorDeviceWithState,
    selectSelectedDevice,
} from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    accountsActions,
    endUnfinishedDiscoveryThunk,
    forgetDisconnectedDevicesThunk,
    handleDeviceDisconnectThunk,
    observeSelectedDeviceThunk,
    selectAccountsByDeviceState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import {
    type NativeBluetoothRootState,
    selectIsBluetoothDeviceOsUnpairingRequired,
} from '@suite-native/bluetooth';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';
import { reportSecurityCheck } from '@suite-native/sentry';
import { setShouldShowAutoEjectAlert } from '@suite-native/settings';
import { DEVICE, isDeviceEventOfType } from '@trezor/connect';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import { reportDeviceConnectionAnalytics } from '../utils';

const isActionDeviceRelated = (action: UnknownAction): boolean => {
    if (
        isAnyOf(
            deviceActions.selectDevice,
            deviceActions.addButtonRequest,
            deviceActions.removeButtonRequests,
            deviceActions.setRememberDevice,
            deviceActions.forgetDevice,
            deviceActions.setDiscovered,
        )(action)
    ) {
        return true;
    }

    return isAnyDeviceEventAction(action);
};

type DeviceMiddlewareDeps = WithServices<SuiteSyncDep & NativeAnalyticsDep>;
type DeviceMiddlewareState = AccountsRootState &
    DiscoveryRootState &
    NativeBluetoothRootState &
    DeviceRootState;

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps<
    DeviceMiddlewareDeps,
    UnknownAction,
    DeviceMiddlewareState
>((action, { dispatch, next, getState, extra }) => {
    if (deviceActions.deviceDisconnect.match(action)) {
        // Forgetting an unremembered device below deletes its discovery, so its outcome is recorded first.
        dispatch(
            endUnfinishedDiscoveryThunk({
                devicePath: action.payload.path,
                status: {
                    status: 'failed',
                    error: 'Device disconnected',
                    errorCode: 'Device_Disconnected',
                },
            }),
        );
        dispatch(
            forgetDisconnectedDevicesThunk({
                device: action.payload,
                forceForget: selectIsBluetoothDeviceOsUnpairingRequired(getState()),
            }),
        );

        const discovery = selectDiscoveryByDevicePath(getState(), action.payload.path);
        if (discovery?.status === 'complete' && action.payload.mode === 'normal') {
            dispatch(setShouldShowAutoEjectAlert(true));
        }
    }

    /* The `next` function has to be executed here, because the further dispatched actions of this middleware
         expect that the state was already changed by the action stored in the `action` variable. */
    next(action);

    if (deviceActions.forgetDevice.match(action)) {
        const { device } = action.payload;

        dispatch(handleDeviceDisconnectThunk(device));

        if (isTrezorDeviceWithState(device)) {
            const accountsToRemove = selectAccountsByDeviceState(getState(), device.state);
            dispatch(accountsActions.removeAccount(accountsToRemove));
            extra.services.suiteSync.turnOffSuiteSyncForWallet({
                deviceStaticSessionId: device.state.staticSessionId,
            });
        }
    }

    if (firmwareActions.setStatus.match(action) && action.payload === 'done') {
        // Having just installed FW, we can mark the device as known, so that Device Visual Check is not seen again.
        // A device without FW has no id, so the check confirmed before the installation couldn't be persisted then.
        // `firmware.cachedDevice` is unusable: it's a snapshot from before the installation, so its id is outdated
        // and its path changes with the reconnection during the installation. The selected device is used instead,
        // relying on the UI not allowing to select a different device while the installation is underway.
        // The logic is duplicated in packages/suite/src/middlewares/onboarding/onboardingMiddleware.ts for desktop/web.
        const deviceId = selectSelectedDevice(getState())?.id;
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
    }

    if (deviceActions.connectDevice.match(action)) {
        reportDeviceConnectionAnalytics(action.payload.device, extra.services.analytics);
    } else if (deviceActions.deviceDisconnect.match(action)) {
        dispatch(handleDeviceDisconnectThunk(action.payload));

        clearAndUnlockDeviceAccessQueue();
    } else if (isDeviceEventOfType(action, DEVICE.FIRMWARE_VERSION_CHANGED)) {
        const { device, oldVersion, newVersion } = action.payload;
        reportSecurityCheck({
            level: 'error',
            checkType: 'Firmware version',
            contextData: {
                model: device?.features?.internal_model,
                revision: device?.features?.revision,
                oldVersion,
                newVersion,
                vendor: device?.features?.fw_vendor,
                error: 'Firmware version changed unexpectedly.',
            },
        });
    }

    if (isActionDeviceRelated(action)) {
        dispatch(observeSelectedDeviceThunk());
    }

    return action;
});
