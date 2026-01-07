import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import {
    isFlowEndingButtonRequest,
    isPinButtonRequestCode,
    isSuiteSyncButtonRequest,
} from './utils';

export enum DeviceAuthorizationStep {
    Idle = 'Idle', // Default state, AuthorizeDeviceStack should not be focused.

    // Custom continue on your trezor
    PinRequested = 'PinRequested',
    AddPassphraseWallet = 'AddPassphraseWallet', // When adding a new passphrase wallet
    PassphraseRequested = 'PassphraseRequested',
    CheckPassphraseOnDevice = 'CheckPassphraseOnDevice',
    InputPassphraseOnDevice = 'InputPassphraseOnDevice',

    // Default continue on your trezor
    ContinueOnTrezorRequested = 'ContinueOnTrezorRequested',
}

export enum DeviceAuthorizationIntent {
    AddHiddenWallet = 'addHiddenWallet',
}

export type DeviceAuthorizationState = {
    deviceAuthorizationStep: DeviceAuthorizationStep;
    deviceAuthorizationIntent: DeviceAuthorizationIntent | null;
};

export type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

export const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
    deviceAuthorizationIntent: null,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {
        changeDeviceAuthorizationStep: (
            state,
            { payload }: PayloadAction<DeviceAuthorizationStep>,
        ) => {
            state.deviceAuthorizationStep = payload;
        },
        changeDeviceAuthorizationIntent: (
            state,
            { payload }: PayloadAction<DeviceAuthorizationIntent | null>,
        ) => {
            state.deviceAuthorizationIntent = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(UI.REQUEST_PIN, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
            })
            .addCase(UI.REQUEST_PASSPHRASE, state => {
                // Adding passphrase wallet is handled by separate screen
                if (state.deviceAuthorizationIntent === DeviceAuthorizationIntent.AddHiddenWallet) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.AddPassphraseWallet;
                } else {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.PassphraseRequested;
                }
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                state.deviceAuthorizationIntent = null;
            })
            .addCase(UI.REQUEST_PASSPHRASE_ON_DEVICE, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.InputPassphraseOnDevice;
            })
            .addMatcher(isFlowEndingButtonRequest, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                state.deviceAuthorizationIntent = null;
            })
            .addMatcher(isSuiteSyncButtonRequest, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.ContinueOnTrezorRequested;
            })
            .addMatcher(isPinButtonRequestCode, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
            });
    },
});

export const selectDeviceAuthorizationStep = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep;

export const selectDeviceAuthorizationIntent = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationIntent;

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep ===
        DeviceAuthorizationStep.PassphraseRequested ||
    state.deviceAuthorization.deviceAuthorizationStep ===
        DeviceAuthorizationStep.CheckPassphraseOnDevice ||
    state.deviceAuthorization.deviceAuthorizationStep ===
        DeviceAuthorizationStep.InputPassphraseOnDevice;

export const selectInputPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep ===
    DeviceAuthorizationStep.InputPassphraseOnDevice;

export const selectCheckPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep ===
    DeviceAuthorizationStep.CheckPassphraseOnDevice;

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

    return (
        state.deviceAuthorization.deviceAuthorizationStep !==
        DeviceAuthorizationStep.PassphraseRequested
    );
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

export const { changeDeviceAuthorizationStep, changeDeviceAuthorizationIntent } =
    deviceAuthorizationSlice.actions;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
