import { initialWalletSettingsState } from '@suite-common/wallet-core';

import { migrateAutoEjectToWalletSettings } from '../../migrations/walletSettings/v2';

describe(migrateAutoEjectToWalletSettings.name, () => {
    it('migrates value from devices.isDeviceAutoEjectEnabled to walletSettings.autoEject', () => {
        const devicesState = { isDeviceAutoEjectEnabled: true };
        const oldWalletSettings = initialWalletSettingsState;
        // simulate old state without isAutoEjectEnabled
        delete (oldWalletSettings as any).autoEject;

        const migrated = migrateAutoEjectToWalletSettings(devicesState, oldWalletSettings);

        expect(migrated.isAutoEjectEnabled).toBe(true);
    });
});
