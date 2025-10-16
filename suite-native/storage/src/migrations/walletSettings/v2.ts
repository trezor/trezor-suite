import { getStoredState } from 'redux-persist';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { WalletSettings } from '@suite-common/wallet-types';

import { initMmkvStorage } from '../../storage';

type OldDevicesState = { isDeviceAutoEjectEnabled?: boolean } | undefined;

/**
 * Migrates device.isDeviceAutoEjectEnabled to walletSettings.autoEject
 * If the value is not present, it falls back to walletSettings initial state (false)
 */
export const migrateAutoEjectToWalletSettings = async (
    walletSettingsState: WalletSettings,
): Promise<WalletSettings> => {
    const devicesState: OldDevicesState = await getStoredState({
        key: 'devices',
        storage: await initMmkvStorage(),
    });

    const isAutoEjectEnabled =
        devicesState?.isDeviceAutoEjectEnabled ?? initialWalletSettingsState.isAutoEjectEnabled;

    const migratedState = {
        ...walletSettingsState,
        isAutoEjectEnabled,
        isAutoForgetDeviceDataEnabled: initialWalletSettingsState.isAutoEjectEnabled,
    };

    return migratedState;
};
