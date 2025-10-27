import { getStoredState } from 'redux-persist';

import { WalletSettings } from '@suite-common/wallet-types';

jest.mock('../../storage', () => ({
    initMmkvStorage: jest.fn().mockResolvedValue({}),
}));

jest.mock('redux-persist', () => ({
    getStoredState: jest.fn(),
}));

import { migrateAutoEjectToWalletSettings } from '../../migrations/walletSettings/v2';

const mockGetStoredState = getStoredState as jest.MockedFunction<typeof getStoredState>;

describe(migrateAutoEjectToWalletSettings.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('migrates value from devices.isDeviceAutoEjectEnabled to walletSettings.isAutoEjectEnabled', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'devices') {
                return Promise.resolve({
                    isDeviceAutoEjectEnabled: true,
                });
            }

            return Promise.resolve(undefined);
        });

        const walletSettingsState = { someOtherProperty: 'value' } as unknown as WalletSettings;

        const migratedState = await migrateAutoEjectToWalletSettings(walletSettingsState);

        expect(migratedState).toEqual({
            someOtherProperty: 'value',
            isAutoEjectEnabled: true,
            isAutoForgetDeviceDataEnabled: false,
        });
    });

    it('uses initial state value when devices.isDeviceAutoEjectEnabled is not present', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'devices') {
                return Promise.resolve({});
            }

            return Promise.resolve(undefined);
        });

        const walletSettingsState = { someOtherProperty: 'value' } as unknown as WalletSettings;

        const migratedState = await migrateAutoEjectToWalletSettings(walletSettingsState);

        expect(migratedState).toEqual({
            someOtherProperty: 'value',
            isAutoEjectEnabled: false,
            isAutoForgetDeviceDataEnabled: false,
        });
    });

    it('returns original state when walletSettingsState is null/undefined', async () => {
        // @ts-expect-error
        const migratedState = await migrateAutoEjectToWalletSettings(null);

        expect(migratedState).toBeNull();
    });
});
