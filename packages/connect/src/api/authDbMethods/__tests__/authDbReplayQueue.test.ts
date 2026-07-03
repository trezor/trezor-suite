import { bytesToHex } from '@noble/hashes/utils.js';

import { entryToValueBytes } from '@trezor/authdb';
import type {
    AuthLabelLookupProvider,
    OfflineQueueEntry,
    OfflineQueueProvider,
} from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbReplayQueue from '../api/authDbReplayQueue';

type MockProvider = AuthLabelLookupProvider & Partial<OfflineQueueProvider>;

const newValueHex = (label: string, counter: number) =>
    bytesToHex(entryToValueBytes('btc', { metadata: { label }, counter }));

const buildProvider = (overrides: Partial<MockProvider> = {}): MockProvider => ({
    lookup: jest.fn().mockResolvedValue(null),
    lookupOrCreate: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
    getAllEntries: jest.fn().mockResolvedValue([]),
    getTreeState: jest.fn().mockResolvedValue(null),
    setTreeState: jest.fn().mockResolvedValue(undefined),
    getQueueEntries: jest.fn().mockResolvedValue([]),
    appendQueueEntries: jest.fn().mockResolvedValue(undefined),
    clearQueueEntries: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

const buildMethod = (payload: Record<string, unknown>, deviceInstance?: any) => {
    const method = new AuthDbReplayQueue({
        payload: {
            method: 'authDbReplayQueue',
            walletId: 'wallet1',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('authDbReplayQueue', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/authLabelLookupProvider/);
    });

    it('throws when the provider does not support an offline queue', async () => {
        const provider = buildProvider({
            getQueueEntries: undefined,
            clearQueueEntries: undefined,
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/OfflineQueueProvider/);
    });

    it('replays a single queued insert entry onto the device', async () => {
        const entry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac1',
            sequence: 1,
            address: 'bc1qaddr',
            oldValue: '',
            newValue: newValueHex('x', 1),
        };
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue([entry]),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 1, new_root: 'root1' },
        });
        const method = buildMethod({}, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbUpdateLeaf',
            'AuthDbUpdateLeafResponse',
            expect.objectContaining({
                old_value: '',
                new_value: entry.newValue,
                mac: 'mac1',
                device_id: 'dev1',
            }),
        );
        expect(provider.upsert).toHaveBeenCalledWith('wallet1', 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: 'root1',
            counter: 1,
        });
        expect(provider.clearQueueEntries).toHaveBeenCalledWith('wallet1', 1);
        expect(result).toEqual({ appliedCount: 1, counter: 1, root: 'root1' });
    });

    it('replays multiple entries in order and reports the final checkpoint', async () => {
        const entries: OfflineQueueEntry[] = [
            {
                deviceId: 'dev1',
                walletId: 'wallet1',
                mac: 'mac1',
                sequence: 1,
                address: 'bc1qaddr',
                oldValue: '',
                newValue: newValueHex('first', 1),
            },
            {
                deviceId: 'dev1',
                walletId: 'wallet1',
                mac: 'mac2',
                sequence: 2,
                address: 'bc1qaddr',
                oldValue: newValueHex('first', 1),
                newValue: newValueHex('second', 2),
            },
        ];
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue(entries),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest
            .fn()
            .mockResolvedValueOnce({ message: { counter: 1, new_root: 'root1' } })
            .mockResolvedValueOnce({ message: { counter: 2, new_root: 'root2' } });
        const method = buildMethod({}, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledTimes(2);
        expect(provider.clearQueueEntries).toHaveBeenNthCalledWith(1, 'wallet1', 1);
        expect(provider.clearQueueEntries).toHaveBeenNthCalledWith(2, 'wallet1', 2);
        expect(result).toEqual({ appliedCount: 2, counter: 2, root: 'root2' });
    });

    it('does not upsert or clear the queue when the device rejects an entry', async () => {
        const entry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac1',
            sequence: 1,
            address: 'bc1qaddr',
            oldValue: '',
            newValue: newValueHex('x', 1),
        };
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue([entry]),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockRejectedValue(new Error('device rejected mac'));
        const method = buildMethod({}, buildDevice(typedCall));

        await expect(method.run()).rejects.toThrow(/device rejected mac/);
        expect(provider.upsert).not.toHaveBeenCalled();
        expect(provider.clearQueueEntries).not.toHaveBeenCalled();
    });
});
