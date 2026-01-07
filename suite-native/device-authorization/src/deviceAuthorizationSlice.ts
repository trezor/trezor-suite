import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { isFlowEndingButtonRequest, isPinButtonRequestCode } from './utils';

export enum DeviceState {
    Idle = 'Idle', // Default state, AuthorizeDeviceStack should not be focused.
    PinRequested = 'PinRequested',
    PassphraseRequested = 'PassphraseRequested',
    CheckPassphraseOnDevice = 'CheckPassphraseOnDevice',
    InputPassphraseOnDevice = 'InputPassphraseOnDevice',
    ContinueOnTrezorRequested = 'ContinueOnTrezorRequested',
}

export type DeviceAuthorizationState = {
    deviceState: DeviceState;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

export const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    deviceState: DeviceState.Idle,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {
        changeDeviceAuthorizationState: (state, { payload }: PayloadAction<DeviceState>) => {
            state.deviceState = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(UI.REQUEST_PIN, state => {
                state.deviceState = DeviceState.PassphraseRequested;
            })
            .addCase(UI.REQUEST_PASSPHRASE, state => {
                state.deviceState = DeviceState.PassphraseRequested;
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.deviceState = DeviceState.Idle;
            })
            .addCase(UI.REQUEST_PASSPHRASE_ON_DEVICE, state => {
                state.deviceState = DeviceState.InputPassphraseOnDevice;
            })
            .addMatcher(isFlowEndingButtonRequest, state => {
                state.deviceState = DeviceState.Idle;
            })
            .addMatcher(isPinButtonRequestCode, state => {
                state.deviceState = DeviceState.PinRequested;
            });
    },
});

export const selectIsIdleDeviceAuthorization = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceState === DeviceState.Idle;

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceState === DeviceState.PinRequested;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceState === DeviceState.PassphraseRequested ||
    state.deviceAuthorization.deviceState === DeviceState.CheckPassphraseOnDevice ||
    state.deviceAuthorization.deviceState === DeviceState.InputPassphraseOnDevice;

export const selectInputPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceState === DeviceState.InputPassphraseOnDevice;

export const selectCheckPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceState === DeviceState.CheckPassphraseOnDevice;

export const selectHasPassphraseError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return (
        discovery?.isAddingExistingWallet &&
        ['failed', 'cancelled', 'passphrase-mismatch'].includes(discovery.status)
    );
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

export const isPassphraseDeviceLoadingDone = (
    state: DiscoveryRootState & DeviceRootState & DeviceAuthorizationRootState,
) => {
    if (!state.device.selectedDevice?.state) {
        return false;
    }

    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return false;
    }

    return state.deviceAuthorization.deviceState !== DeviceState.PassphraseRequested;
};

export const selectPassphraseDeviceNotEmpty = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

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
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    return (
        discovery.status === 'complete' ||
        (discovery.status === 'progress' && discovery.hasLoadedAnyNonEmptyAccount)
    );
};

export const { changeDeviceAuthorizationState } = deviceAuthorizationSlice.actions;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
