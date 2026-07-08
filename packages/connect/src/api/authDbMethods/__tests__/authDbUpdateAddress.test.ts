import type { AuthLabelLookupProvider, AuthLabelRow } from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbUpdateAddress from '../api/authDbUpdateAddress';

type MockProvider = AuthLabelLookupProvider;

const buildProvider = (overrides: Partial<MockProvider> = {}): MockProvider => ({
    lookup: jest.fn().mockResolvedValue(null),
    lookupOrCreate: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
    getAllEntries: jest.fn().mockResolvedValue([]),
    getTreeState: jest.fn().mockResolvedValue(null),
    setTreeState: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

// payload.device just signals "online mode" to the constructor (see useDevice);
// the actual Device instance used by getDevice()/typedCall is wired separately via setDevice().
const buildMethod = (payload: Record<string, unknown>, deviceInstance?: any) => {
    const method = new AuthDbUpdateAddress({
        payload: {
            method: 'authDbUpdateAddress',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            metadata: { label: 'x' },
            walletId: 'wallet1',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('authDbUpdateAddress', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({ device: {} }, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/authLabelLookupProvider/);
    });

    it('inserts a new entry with a non-membership proof and no old_value', async () => {
        const existingRows: AuthLabelRow[] = [
            { address: 'bc1qother', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
        ];
        const provider = buildProvider({
            getAllEntries: jest.fn().mockResolvedValue(existingRows),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 1, new_root: 'root1' },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbUpdateLeaf',
            'AuthDbUpdateLeafResponse',
            // global-counter stamp: empty tree_state -> new_counter = 1
            expect.objectContaining({ old_value: '', proof: expect.any(Array), new_counter: 1 }),
        );
        expect(provider.upsert).toHaveBeenCalledWith('wallet1', 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(result).toEqual({ counter: 1, root: 'root1' });
    });

    it('updates an existing entry, stamping the new leaf with the global counter + 1', async () => {
        const existingRows: AuthLabelRow[] = [
            {
                address: 'bc1qaddr',
                networkSymbol: 'btc',
                entry: { metadata: { label: 'old' }, counter: 3 },
            },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: { label: 'old' }, counter: 3 }),
            getAllEntries: jest.fn().mockResolvedValue(existingRows),
            // global counter is 3 -> the new leaf is stamped 4
            getTreeState: jest.fn().mockResolvedValue({ root: 'r', counter: 3 }),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 4, new_root: 'root2' },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await method.run();

        const [, , params] = typedCall.mock.calls[0];
        expect(params.old_value).not.toBe('');
        expect(params.witness_address).toBeUndefined();
        expect(params.old_counter).toBe(3); // previous global stamp of the leaf
        expect(params.new_counter).toBe(4); // global counter 3 -> 4
        expect(provider.upsert).toHaveBeenCalledWith('wallet1', 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 4,
        });
    });

    it('runs offline (no device) by persisting locally and recomputing the root', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(provider.upsert).toHaveBeenCalledWith('wallet1', 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(result.counter).toBe(1);
        expect(typeof result.root).toBe('string');
    });

    it('surfaces localCacheError instead of throwing when the device already committed', async () => {
        const provider = buildProvider({
            upsert: jest.fn().mockRejectedValue(new Error('disk full')),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 7, new_root: 'root7' },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(result).toEqual({
            counter: 7,
            root: 'root7',
            localCacheError: 'disk full',
        });
    });
});
