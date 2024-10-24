import { TrezorDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/connect';

// These hidden device constants are used in mobile app to hold all imported accounts.

// Changing these strings will result in app crash as accounts are persisted.
// Account key is linked to device state and relies on these strings.
export const PORTFOLIO_TRACKER_DEVICE_ID = 'hiddenDeviceWithImportedAccounts';
export const PORTFOLIO_TRACKER_DEVICE_STATE = `state@${PORTFOLIO_TRACKER_DEVICE_ID}:1`;

export const portfolioTrackerDevice: TrezorDevice = {
    type: 'acquired',
    id: PORTFOLIO_TRACKER_DEVICE_ID,
    status: 'available',
    mode: 'normal',
    state: {
        staticSessionId: PORTFOLIO_TRACKER_DEVICE_STATE,
    },
    label: 'My assets',
    // @ts-expect-error - local override
    path: 'imported-1',
    firmware: 'valid',
    name: 'Portfolio Tracker',
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
        backup_availability: 'NotAvailable',
        flags: 0,
        model: 'T',
        internal_model: DeviceModelInternal.T2T1,
        fw_major: null,
        fw_minor: null,
        fw_patch: null,
        fw_vendor: null,
        unfinished_backup: false,
        no_backup: false,
        recovery_status: 'Nothing',
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
    metadata: {},
    passwords: {},
    unavailableCapabilities: {},
    availableTranslations: [],
    remember: true,
    authenticityChecks: {
        firmwareRevision: { success: true },
        firmwareHash: { success: true },
    },
};
