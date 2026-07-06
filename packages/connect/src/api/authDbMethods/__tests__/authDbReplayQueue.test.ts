import { bytesToHex } from '@noble/hashes/utils.js';

import { entryToValueBytes } from '@trezor/authdb';
import type {
    AuthLabelLookupProvider,
    AuthLabelRow,
    OfflineQueueEntry,
    OfflineQueueProvider,
} from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbReplayQueue from '../api/authDbReplayQueue';

type MockProvider = AuthLabelLookupProvider & Partial<OfflineQueueProvider>;

const valueHex = (label: string, counter: number) =>
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

// Dispatches by message type, matching the real device's per-call responses.
const buildDevice = (responses: Record<string, any>) => {
    const typedCall = jest.fn((type: string) => Promise.resolve(responses[type]));

    return { getCommands: () => ({ typedCall }), features: { device_id: 'phys-device-1' } } as any;
};

const emptyDrain = {
    message: { current_root: undefined, counter: 0, wallet_id: 'wallet1', operations: [] },
};

describe('authDbReplayQueue', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({}, buildDevice({}));
        await expect(method.run()).rejects.toThrow(/authLabelLookupProvider/);
    });

    it('throws when the provider does not support an offline queue', async () => {
        const provider = buildProvider({ appendQueueEntries: undefined });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice({}));
        await expect(method.run()).rejects.toThrow(/OfflineQueueProvider/);
    });

    it('throws when the drained wallet_id does not match the requested walletId', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const device = buildDevice({
            AuthDbGetOfflineOperations: {
                message: { counter: 0, wallet_id: 'other-wallet', operations: [] },
            },
        });
        const method = buildMethod({}, device);
        await expect(method.run()).rejects.toThrow(/wallet_id/);
    });

    it('does nothing when both the drain and the local queue are empty', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const device = buildDevice({ AuthDbGetOfflineOperations: emptyDrain });
        const method = buildMethod({}, device);

        const result = await method.run();

        expect(provider.appendQueueEntries).not.toHaveBeenCalled();
        expect(result).toEqual({ appliedCount: 0, counter: 0, root: '', conflicts: [] });
    });

    it('drains, persists, and applies a single valid entry as one batch call', async () => {
        const entry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac1',
            sequence: 1,
            address: 'bc1qaddr',
            oldValue: '',
            newValue: valueHex('x', 1),
        };
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue([entry]),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const device = buildDevice({
            AuthDbGetOfflineOperations: {
                message: {
                    counter: 0,
                    wallet_id: 'wallet1',
                    operations: [
                        {
                            sequence: 1,
                            address: 'bc1qaddr',
                            old_value: undefined,
                            new_value: entry.newValue,
                            mac: 'mac1',
                        },
                    ],
                },
            },
            AuthDbApplyOfflineOperations: {
                message: {
                    applied_count: 1,
                    new_root: 'root1',
                    counter: 1,
                    last_applied_sequence: 1,
                    wallet_id: 'wallet1',
                    root_mac: 'root-mac-1',
                },
            },
            AuthDbDeleteOfflineOperations: {
                message: { deleted_count: 1, remaining_count: 0 },
            },
        });
        const method = buildMethod({}, device);

        const result = await method.run();

        const { typedCall } = device.getCommands();
        expect(provider.appendQueueEntries).toHaveBeenCalledWith([
            {
                deviceId: 'phys-device-1',
                walletId: 'wallet1',
                mac: 'mac1',
                sequence: 1,
                address: 'bc1qaddr',
                oldValue: '',
                newValue: entry.newValue,
            },
        ]);
        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbApplyOfflineOperations',
            'AuthDbApplyOfflineOperationsResponse',
            expect.objectContaining({ operations: expect.arrayContaining([expect.any(Object)]) }),
        );
        const [, , applyParams] = typedCall.mock.calls.find(
            (c: any[]) => c[0] === 'AuthDbApplyOfflineOperations',
        )!;
        expect(applyParams.operations).toHaveLength(1);
        expect(provider.upsert).toHaveBeenCalledWith('wallet1', 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: 'root1',
            counter: 1,
            mac: 'root-mac-1',
        });
        expect(provider.clearQueueEntries).toHaveBeenCalledWith('wallet1', 1);
        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbDeleteOfflineOperations',
            'AuthDbDeleteOfflineOperationsResponse',
            {},
        );
        expect(result).toEqual({ appliedCount: 1, counter: 1, root: 'root1', conflicts: [] });
    });

    it('detects a stale entry, excludes it from the batch, and blocks later entries', async () => {
        const staleEntry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac1',
            sequence: 1,
            address: 'bc1qaddr',
            oldValue: valueHex('canonical-was-different', 1), // does NOT match canonical below
            newValue: valueHex('attempted-update', 2),
        };
        const laterEntry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac2',
            sequence: 2,
            address: 'bc1qother',
            oldValue: '',
            newValue: valueHex('unrelated-insert', 1),
        };
        const canonicalRows: AuthLabelRow[] = [
            {
                address: 'bc1qaddr',
                networkSymbol: 'btc',
                entry: { metadata: { label: 'actual' }, counter: 1 },
            },
        ];
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue([staleEntry, laterEntry]),
            getAllEntries: jest.fn().mockResolvedValue(canonicalRows),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const device = buildDevice({ AuthDbGetOfflineOperations: emptyDrain });
        const method = buildMethod({}, device);

        const result = await method.run();

        const { typedCall } = device.getCommands();
        expect(typedCall).not.toHaveBeenCalledWith(
            'AuthDbApplyOfflineOperations',
            expect.anything(),
            expect.anything(),
        );
        expect(provider.upsert).not.toHaveBeenCalled();
        expect(provider.clearQueueEntries).not.toHaveBeenCalled();
        expect(result.appliedCount).toBe(0);
        expect(result.conflicts).toHaveLength(1);
        const conflict = result.conflicts[0]!;
        expect(conflict.entry).toEqual(staleEntry);
        expect(conflict.reason).toMatch(/stale/);
    });

    it('applies a conflict-free prefix and reports the conflict for the entry after it', async () => {
        const goodEntry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac1',
            sequence: 1,
            address: 'bc1qgood',
            oldValue: '',
            newValue: valueHex('ok', 1),
        };
        const staleEntry: OfflineQueueEntry = {
            deviceId: 'dev1',
            walletId: 'wallet1',
            mac: 'mac2',
            sequence: 2,
            address: 'bc1qstale',
            oldValue: valueHex('wrong-base', 1),
            newValue: valueHex('would-be-update', 2),
        };
        const provider = buildProvider({
            getQueueEntries: jest.fn().mockResolvedValue([goodEntry, staleEntry]),
            getAllEntries: jest.fn().mockResolvedValue([]),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const device = buildDevice({
            AuthDbGetOfflineOperations: emptyDrain,
            AuthDbApplyOfflineOperations: {
                message: {
                    applied_count: 1,
                    new_root: 'root1',
                    counter: 1,
                    last_applied_sequence: 1,
                    wallet_id: 'wallet1',
                    root_mac: 'root-mac-1',
                },
            },
            AuthDbDeleteOfflineOperations: { message: { deleted_count: 1, remaining_count: 1 } },
        });
        const method = buildMethod({}, device);

        const result = await method.run();

        const { typedCall } = device.getCommands();
        const [, , applyParams] = typedCall.mock.calls.find(
            (c: any[]) => c[0] === 'AuthDbApplyOfflineOperations',
        )!;
        expect(applyParams.operations).toHaveLength(1);
        expect(applyParams.operations[0].sequence).toBe(1);
        expect(result.appliedCount).toBe(1);
        expect(result.conflicts).toHaveLength(1);
        const conflict = result.conflicts[0]!;
        expect(conflict.entry).toEqual(staleEntry);
    });
});
