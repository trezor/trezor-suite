import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { WalletSettings } from '@suite-common/wallet-types';

type OldDevicesState = { isDeviceAutoEjectEnabled?: boolean } | undefined;

/**
 * Migrates device.isDeviceAutoEjectEnabled to walletSettings.autoEject
 * If the value is not present, it falls back to walletSettings initial state (false)
 */
export const migrateAutoEjectToWalletSettings = (
    devicesState: OldDevicesState,
    walletSettingsState: WalletSettings,
): WalletSettings => {
    const isAutoEjectEnabled =
        devicesState?.isDeviceAutoEjectEnabled ?? initialWalletSettingsState.isAutoEjectEnabled;

    const migratedState = {
        ...walletSettingsState,
        isAutoEjectEnabled,
        isAutoForgetDeviceDataEnabled: initialWalletSettingsState.isAutoEjectEnabled,
    };

    return migratedState;
};
