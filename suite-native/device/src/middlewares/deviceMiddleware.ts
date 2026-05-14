import { type AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, isTrezorDeviceWithState } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import {
    accountsActions,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectAccountsByDeviceState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { asTypedNativeAnalytics } from '@suite-native/analytics';
import { selectIsBluetoothDeviceOsUnpairingRequired } from '@suite-native/bluetooth';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';
import { reportSecurityCheck } from '@suite-native/sentry';
import { setShouldShowAutoEjectAlert } from '@suite-native/settings';
import { DEVICE } from '@trezor/connect';

import { isDeviceEventAction, reportDeviceConnectionAnalytics } from '../utils';

const isActionDeviceRelated = (action: AnyAction): boolean => {
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

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState, extra }) => {
        if (isDeviceEventAction(action, DEVICE.DISCONNECT)) {
            dispatch(
                forgetDisconnectedDevices({
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

            dispatch(handleDeviceDisconnect(device));

            if (isTrezorDeviceWithState(device)) {
                const accountsToRemove = selectAccountsByDeviceState(getState(), device.state);
                dispatch(accountsActions.removeAccount(accountsToRemove));
                extra.services.suiteSync.turnOffSuiteSyncForWallet({
                    deviceStaticSessionId: device.state.staticSessionId,
                });
            }
        }

        switch (action.type) {
            case DEVICE.CONNECT: {
                reportDeviceConnectionAnalytics(
                    action.payload.device,
                    asTypedNativeAnalytics(extra.services.analytics),
                );
                break;
            }
            case DEVICE.DISCONNECT:
                dispatch(handleDeviceDisconnect(action.payload));

                clearAndUnlockDeviceAccessQueue();
                break;

            case DEVICE.FIRMWARE_VERSION_CHANGED: {
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
                break;
            }

            default:
                break;
        }

        if (isActionDeviceRelated(action)) {
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
