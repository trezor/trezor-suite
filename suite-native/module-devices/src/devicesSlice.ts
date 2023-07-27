import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/connect';

export const HIDDEN_DEVICE_ID = 'hiddenDeviceWithImportedAccounts';
export const HIDDEN_DEVICE_STATE = `state@${HIDDEN_DEVICE_ID}:1`;

// This is temporary solution for MVP purposes. We have one hidden device and all imported accounts belongs to it.
export const hiddenDevice: TrezorDevice = {
    type: 'acquired',
    id: HIDDEN_DEVICE_ID,
    status: 'available',
    mode: 'normal',
    state: HIDDEN_DEVICE_STATE,
    label: 'Hidden device with imported accounts',
    path: '1',
    firmware: 'valid',
    features: {
        vendor: 'trezor.io',
        major_version: 2,
        minor_version: 1,
        patch_version: 1,
        bootloader_mode: null,
        device_id: 'device-id',
        pin_protection: false,
        passphrase_protection: false,
        language: 'en-US',
        label: 'My Trezor',
        initialized: true,
        revision: 'df0963ec',
        bootloader_hash: '7447a41717022e3eb32011b00b2a68ebb9c7f603cdc730e7307850a3f4d62a5c',
        imported: null,
        unlocked: true,
        firmware_present: null,
        needs_backup: false,
        flags: 0,
        model: 'T',
        internal_model: DeviceModelInternal.T2T1,
        fw_major: null,
        fw_minor: null,
        fw_patch: null,
        fw_vendor: null,
        unfinished_backup: false,
        no_backup: false,
        recovery_mode: false,
        capabilities: [],
        backup_type: 'Bip39',
        sd_card_present: false,
        sd_protection: false,
        wipe_code_protection: false,
        session_id: 'session-id',
        passphrase_always_on_device: false,
        safety_checks: 'Strict',
        auto_lock_delay_ms: 60000,
        display_rotation: 0,
        experimental_features: false,
    },
    connected: false,
    useEmptyPassphrase: true,
    available: true,
    ts: 0,
    buttonRequests: [],
    metadata: {
        status: 'disabled',
    },
    unavailableCapabilities: {},
};

export const actionPrefix = '@devices';

export type DevicesState = TrezorDevice[];

const initialState: DevicesState = [];

export type DevicesRootState = {
    devices: DevicesState;
};

const devicesSlice = createSlice({
    name: actionPrefix,
    initialState,
    reducers: {
        createDevice: (state, action: PayloadAction<TrezorDevice>) => {
            state.push(action.payload);
        },
    },
});

export const selectDeviceById = (deviceId: string) => (state: DevicesRootState) =>
    state.devices.find(device => device.id === deviceId);

export const selectDevices = (state: DevicesRootState) => state.devices;

export const { createDevice } = devicesSlice.actions;
export const devicesReducer = devicesSlice.reducer;
