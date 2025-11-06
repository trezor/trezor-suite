import { getStoredState } from 'redux-persist';

import { migrateAutoEjectToWalletSettings } from '../../migrations/walletSettings/v2';

jest.mock('../../storage', () => ({
    initMmkvStorage: jest.fn().mockResolvedValue({}),
}));

jest.mock('redux-persist', () => ({
    getStoredState: jest.fn(),
}));

const mockGetStoredState = getStoredState as jest.MockedFunction<typeof getStoredState>;

describe(migrateAutoEjectToWalletSettings.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('migrates value from devices.isDeviceAutoEjectEnabled to walletSettings.autoEject', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
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

        const migrated = await migrateAutoEjectToWalletSettings(oldWalletSettings);

        expect(migrated.isAutoEjectEnabled).toBe(true);
    });

    it('pass previous state if no migration is needed', async () => {
        mockGetStoredState.mockImplementation(() => Promise.resolve(undefined));

        const oldWalletSettings = {
            enabledNetworks: ['btc', 'eth'],
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = await migrateAutoEjectToWalletSettings(oldWalletSettings);

        expect(migrated).toEqual(oldWalletSettings);
    });
});
