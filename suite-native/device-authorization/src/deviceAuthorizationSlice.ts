import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { isPinButtonRequestCode } from './utils';

export type DeviceAuthorizationState = {
    hasDeviceRequestedPin: boolean;
    hasDeviceRequestedPassphrase: boolean;
    checkPassphraseOnDevice: boolean;
    inputPassphraseOnDevice: boolean;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

export const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    hasDeviceRequestedPin: false,
    hasDeviceRequestedPassphrase: false,
    checkPassphraseOnDevice: false,
    inputPassphraseOnDevice: false,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {
        setCheckPassphraseOnDevice: (state, action: PayloadAction<boolean>) => {
            state.checkPassphraseOnDevice = action.payload;
        },
        setInputPassphraseOnDevice: (state, action: PayloadAction<boolean>) => {
            state.inputPassphraseOnDevice = action.payload;
        },
    },
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
                } else {
                    state.checkPassphraseOnDevice = true;
                }

                // @ts-expect-error Actions are not typed properly
                if (action.payload.code === 'ButtonRequest_Address') {
                    state.inputPassphraseOnDevice = false;
                }
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.hasDeviceRequestedPin = false;
                state.hasDeviceRequestedPassphrase = false;
                state.checkPassphraseOnDevice = false;
                state.inputPassphraseOnDevice = false;
            })
            .addCase(UI.REQUEST_PASSPHRASE_ON_DEVICE, state => {
                state.inputPassphraseOnDevice = true;
            });
    },
});

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPin;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPassphrase;

export const selectInputPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.inputPassphraseOnDevice;

export const selectCheckPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.checkPassphraseOnDevice;

export const selectHasPassphraseError = (
    state: DiscoveryRootState & DeviceRootState & DeviceAuthorizationState,
) => {
    // todo: optimize
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    return (
        discovery?.isAddingExistingWallet &&
        ['failed', 'cancelled', 'passphrase-mismatch'].includes(discovery.status)
    );
};

export const selectHasVerificationCancelledError = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    return discovery?.status === 'cancelled';
};

export const selectHasPassphraseMismatchError = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    return discovery?.status === 'passphrase-mismatch';
};

export const selectIsCreatingNewPassphraseWallet = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    return discovery?.isAddingHiddenWallet;
};

export const isPassphraseDeviceLoadingDone = (
    state: DiscoveryRootState & DeviceRootState & DeviceAuthorizationRootState,
) => {
    const selectedDevice = selectSelectedDevice(state);
    if (!selectedDevice?.state) {
        return false;
    }

    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return false;
    }

    return !state.deviceAuthorization.hasDeviceRequestedPassphrase;
};

export const selectPassphraseDeviceNotEmpty = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    switch (discovery.status) {
        case 'confirm-empty-passphrase':
            return false;
        case 'complete':
            return true;
        default:
            return null;
    }
};

export const selectPassphraseDiscoveryCompleted = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    return (
        discovery.status === 'complete' ||
        (discovery.status === 'progress' && discovery.hasLoadedAnyNonEmptyAccount)
    );
};

export const { setCheckPassphraseOnDevice, setInputPassphraseOnDevice } =
    deviceAuthorizationSlice.actions;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
