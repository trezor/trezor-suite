import { AnyAction, isAnyOf } from '@reduxjs/toolkit';
import { A } from '@mobily/ts-belt';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';
import {
    accountsActions,
    authorizeDeviceThunk,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
    selectAccountsByDeviceState,
    createDeviceInstanceThunk,
    createImportedDeviceThunk,
    selectDevice,
    selectDeviceInstances,
} from '@suite-common/wallet-core';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';

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

    return Object.values(DEVICE).includes(action.type);
};

export const prepareDeviceMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }) => {
        if (action.type === DEVICE.DISCONNECT) {
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
            case DEVICE.CONNECT_UNACQUIRED:
                if (isUsbDeviceConnectFeatureEnabled) {
                    await dispatch(selectDeviceThunk(action.payload));

                    const deviceInstances = selectDeviceInstances(getState());
                    const selectedDevice = selectDevice(getState());

                    // If there is selected device, but no useEmptyPassphrase device for connected trezor,
                    // add normal wallet but keep the original one selected.
                    // This happens after connecting device with only remembered passphrases wallet.
                    if (
                        selectedDevice &&
                        A.isEmpty(deviceInstances.filter(d => d.useEmptyPassphrase))
                    ) {
                        await dispatch(
                            createDeviceInstanceThunk({
                                device: selectedDevice,
                                useEmptyPassphrase: true,
                            }),
                        );
                        dispatch(selectDeviceThunk({ device: selectedDevice }));
                    }
                }
                break;
            case DEVICE.DISCONNECT:
                dispatch(handleDeviceDisconnect(action.payload));
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
