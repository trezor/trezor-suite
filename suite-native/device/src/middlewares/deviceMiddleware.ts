import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import {
    createImportedDeviceThunk,
    deviceActions,
    forgetAccountsThunk,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectAccountsByDeviceState,
    selectDeviceThunk,
    selectDiscoveryByDevicePath,
    selectIsDeviceForceRemembered,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { reportSecurityCheck } from '@suite-native/sentry';
import { setShouldShowAutoEjectAlert } from '@suite-native/settings';
import { DEVICE } from '@trezor/connect';
import {
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
    isDeviceInBootloaderMode,
} from '@trezor/device-utils';

import { isDeviceEventAction } from '../utils';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.selectDevice,
            deviceActions.addButtonRequest,
            deviceActions.removeButtonRequests,
            deviceActions.rememberDevice,
            deviceActions.forgetDevice,
        )(action)
    ) {
        return true;
    }

    return isAnyDeviceEventAction(action);
};

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        const isDeviceForceRemembered = selectIsDeviceForceRemembered(getState());

        if (isDeviceEventAction(action, DEVICE.DISCONNECT)) {
            if (!isDeviceForceRemembered) {
                dispatch(forgetDisconnectedDevices({ device: action.payload }));
            }

            const discovery = selectDiscoveryByDevicePath(getState(), action.payload.path);
            if (discovery?.status === 'complete' && action.payload.mode === 'normal') {
                dispatch(setShouldShowAutoEjectAlert(true));
            }
        }

        /* The `next` function has to be executed here, because the further dispatched actions of this middleware
         expect that the state was already changed by the action stored in the `action` variable. */
        next(action);

        if (isAnyOf(createImportedDeviceThunk.fulfilled)(action)) {
            dispatch(selectDeviceThunk({ device: action.payload.device }));
        }

        if (deviceActions.forgetDevice.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload.device));

            const deviceState = action.payload.device.state;
            if (deviceState) {
                const accountsToRemove = selectAccountsByDeviceState(getState(), deviceState);
                dispatch(forgetAccountsThunk({ accountsToRemove }));
            }
        }

        const isUsbDeviceConnectFeatureEnabled = selectIsFeatureFlagEnabled(
            getState(),
            FeatureFlag.IsDeviceConnectEnabled,
        );

        switch (action.type) {
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED: {
                if (isUsbDeviceConnectFeatureEnabled) {
                    dispatch(selectDeviceThunk(action.payload));
                }

                const { device } = action.payload;
                const { features, mode } = device;

                if (features && mode) {
                    analytics.report({
                        type: EventType.ConnectDevice,
                        payload: {
                            mode: isDeviceInBootloaderMode(device) ? 'bootloader' : mode,
                            firmwareVersion: getFirmwareVersionArray(device),
                            pinProtection: features.pin_protection,
                            isBitcoinOnly: hasBitcoinOnlyFirmware(device),
                            deviceLanguage: features.language,
                            deviceModel: features.internal_model,
                        },
                    });
                }
                break;
            }
            case DEVICE.DISCONNECT:
                if (!isDeviceForceRemembered) {
                    // In case of force remember we don't want to call this thunk because it will change selected device
                    dispatch(handleDeviceDisconnect(action.payload));
                }

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
