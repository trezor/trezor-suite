import type { OfflineQueueProvider } from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbGetOfflineOperations from '../api/authDbGetOfflineOperations';

const buildProvider = (overrides: Partial<OfflineQueueProvider> = {}): any => ({
    lookup: jest.fn(),
    lookupOrCreate: jest.fn(),
    upsert: jest.fn(),
    getAllEntries: jest.fn(),
    getTreeState: jest.fn(),
    setTreeState: jest.fn(),
    appendQueueEntries: jest.fn().mockResolvedValue(undefined),
    getQueueEntries: jest.fn().mockResolvedValue([]),
    clearQueueEntries: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

const buildMethod = (deviceInstance?: any) => {
    const method = new AuthDbGetOfflineOperations({
        payload: { method: 'authDbGetOfflineOperations' } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) =>
    ({ getCommands: () => ({ typedCall }), features: { device_id: 'phys-1' } }) as any;

describe('authDbGetOfflineOperations', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when the provider does not support an offline queue', async () => {
        settingsStore.update({ authLabelLookupProvider: { appendQueueEntries: undefined } as any });
        const method = buildMethod(buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/OfflineQueueProvider/);
    });

    it('drains the device queue and persists entries into the provider', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: {
                current_root: 'root1',
                counter: 3,
                wallet_id: 'wallet1',
                operations: [
                    {
                        sequence: 1,
                        address: 'bc1qaddr',
                        old_value: undefined,
                        new_value: 'aa',
                        mac: 'mac1',
                    },
                ],
            },
        });
        const method = buildMethod(buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbGetOfflineOperations',
            'AuthDbGetOfflineOperationsResponse',
            {},
        );
        expect(provider.appendQueueEntries).toHaveBeenCalledWith([
            {
                deviceId: 'phys-1',
                walletId: 'wallet1',
                mac: 'mac1',
                sequence: 1,
                address: 'bc1qaddr',
                oldValue: '',
                newValue: 'aa',
            },
        ]);
        expect(result.counter).toBe(3);
        expect(result.wallet_id).toBe('wallet1');
    });

    it('does not call appendQueueEntries when the queue is empty', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 0, wallet_id: 'wallet1', operations: [] },
        });
        const method = buildMethod(buildDevice(typedCall));

        await method.run();

        expect(provider.appendQueueEntries).not.toHaveBeenCalled();
    });
});
