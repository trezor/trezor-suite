import { type getStoredState } from 'redux-persist';

import { migrateAutoEjectToWalletSettings } from '../../migrations/walletSettings/v2';
import { createMMKVStorageMock } from '../../mmkvStorage.mock';

describe(migrateAutoEjectToWalletSettings.name, () => {
    it('migrates value from devices.isDeviceAutoEjectEnabled to walletSettings.autoEject', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'devices') {
                    return Promise.resolve({
                        isDeviceAutoEjectEnabled: true,
                    });
                }

                return Promise.resolve(undefined);
            });

        const oldWalletSettings = {
            isAutoEjectEnabled: false,
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = await migrateAutoEjectToWalletSettings({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })(oldWalletSettings);

        expect(migrated.isAutoEjectEnabled).toBe(true);
    });

    it('pass previous state if no migration is needed', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(() => Promise.resolve(undefined));

        const oldWalletSettings = {
            enabledNetworks: ['btc', 'eth'],
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = await migrateAutoEjectToWalletSettings({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })(oldWalletSettings);

        expect(migrated).toEqual(oldWalletSettings);
    });
});
