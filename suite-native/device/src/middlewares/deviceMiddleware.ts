import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import {
    accountsActions,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
    createImportedDeviceThunk,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectAccountsByDeviceState,
    selectDeviceThunk,
    selectIsDeviceForceRemembered,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { DEVICE } from '@trezor/connect';
import { getFirmwareVersionArray, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { isDeviceEventAction } from '../utils';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            authorizeDeviceThunk.fulfilled,
            authorizeDeviceThunk.rejected,
            deviceActions.selectDevice,
            deviceActions.receiveAuthConfirm,
            deviceActions.updatePassphraseMode,
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

        if (isDeviceEventAction(action, DEVICE.DISCONNECT) && !isDeviceForceRemembered) {
            dispatch(forgetDisconnectedDevices(action.payload));
        }
        /* The `next` function has to be executed here, because the further dispatched actions of this middleware
         expect that the state was already changed by the action stored in the `action` variable. */
        next(action);

        if (
            isAnyOf(
                createDeviceInstanceThunk.fulfilled,
                createImportedDeviceThunk.fulfilled,
            )(action)
        ) {
            dispatch(selectDeviceThunk({ device: action.payload.device }));
        }

        if (deviceActions.forgetDevice.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload.device));

            const deviceState = action.payload.device.state;
            if (deviceState) {
                const accounts = selectAccountsByDeviceState(getState(), deviceState);
                dispatch(accountsActions.removeAccount(accounts));
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

                const {
                    device: { features, mode },
                } = action.payload;

                if (features && mode) {
                    analytics.report({
                        type: EventType.ConnectDevice,
                        payload: {
                            firmwareVersion: getFirmwareVersionArray(action.payload.device),
                            pinProtection: features.pin_protection,
                            isBitcoinOnly: hasBitcoinOnlyFirmware(action.payload.device),
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
            default:
                break;
        }

        if (isActionDeviceRelated(action)) {
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
