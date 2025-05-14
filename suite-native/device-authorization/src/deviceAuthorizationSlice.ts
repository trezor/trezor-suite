import { createSlice } from '@reduxjs/toolkit';

import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import {
    VerifyPassphraseOnEmptyWalletError,
    cancelPassphraseAndSelectStandardDeviceThunk,
    retryPassphraseAuthenticationThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from './passphraseThunks';
import { isPinButtonRequestCode } from './utils';

export type DeviceAuthorizationState = {
    hasDeviceRequestedPin: boolean;
    hasDeviceRequestedPassphrase: boolean;
    passphraseError:
        | AuthorizeDeviceError
        | CreateDeviceInstanceError
        | VerifyPassphraseOnEmptyWalletError
        | null;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

export const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    hasDeviceRequestedPin: false,
    hasDeviceRequestedPassphrase: false,
    passphraseError: null,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(UI.REQUEST_PIN, state => {
                state.hasDeviceRequestedPin = true;
            })
            .addCase(UI.REQUEST_PASSPHRASE, state => {
                state.hasDeviceRequestedPin = false;
                state.hasDeviceRequestedPassphrase = true;
            })
            .addCase(UI.REQUEST_BUTTON, (state, action) => {
                if (isPinButtonRequestCode(action)) {
                    state.hasDeviceRequestedPin = true;
                } else {
                    state.hasDeviceRequestedPin = false;
                }

                // @ts-expect-error Actions are not typed properly
                if (action.payload.code !== 'ButtonRequest_Other') {
                    state.hasDeviceRequestedPassphrase = false;
                }
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.hasDeviceRequestedPin = false;
                state.hasDeviceRequestedPassphrase = false;
            })
            .addCase(cancelPassphraseAndSelectStandardDeviceThunk.pending.type, state => {
                state.hasDeviceRequestedPassphrase = false;
                state.passphraseError = null;
            })
            .addCase(retryPassphraseAuthenticationThunk.pending, state => {
                state.passphraseError = null;
            })
            .addCase(verifyPassphraseOnEmptyWalletThunk.rejected, (state, action) => {
                if (action.payload) {
                    state.passphraseError = action.payload;
                }
            });
    },
});

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPin;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPassphrase;

export const selectDeviceRequestedAuthorization = (state: DeviceAuthorizationRootState) =>
    selectDeviceRequestedPassphrase(state) || selectDeviceRequestedPin(state);

export const selectPassphraseError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    switch (discovery.status) {
        case 'cancelled':
            return 'action-cancelled';
        case 'passphrase-mismatch':
            return 'passphrase-mismatch';
        default:
            return null;
    }
};

export const selectPassphraseDuplicateStaticSessionId = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'passphrase-duplicate'
        ? discovery.duplicateDeviceStaticSessionId
        : null;
};

export const selectHasVerificationCancelledError = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'cancelled';
};

export const selectHasPassphraseMismatchError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'passphrase-mismatch';
};

export const selectIsCreatingNewPassphraseWallet = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.isAddingHiddenWallet;
};

export const isPassphraseDeviceAuthorized = (state: DiscoveryRootState & DeviceRootState) => {
    if (!state.device.selectedDevice?.state) {
        return false;
    }

    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'progress';
};

export const selectPassphraseDeviceNotEmpty = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    switch (discovery.status) {
        case 'confirm-empty-passphrase':
            return true;
        case 'complete':
            return false;
        default:
            return null;
    }
};

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
