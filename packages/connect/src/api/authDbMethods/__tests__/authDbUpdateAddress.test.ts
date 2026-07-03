import type {
    AuthLabelApprovalProvider,
    AuthLabelLookupProvider,
    AuthLabelRow,
} from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbUpdateAddress from '../api/authDbUpdateAddress';

type MockProvider = AuthLabelLookupProvider & Partial<AuthLabelApprovalProvider>;

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
            expect.objectContaining({ old_value: '', proof: expect.any(Array) }),
        );
        expect(provider.upsert).toHaveBeenCalledWith('bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: 'root1',
            counter: 1,
        });
        expect(result).toEqual({ counter: 1, root: 'root1' });
    });

    it('updates an existing entry with a membership proof and a populated old_value', async () => {
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
        expect(provider.upsert).toHaveBeenCalledWith('bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 4,
        });
    });

    it('auto-picks-up a prior pre-approval via lookupApproval', async () => {
        const provider = buildProvider({
            lookupApproval: jest.fn().mockResolvedValue({ mac: 'deadbeef', deviceId: 'cafe' }),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest
            .fn()
            .mockResolvedValue({ message: { counter: 1, new_root: 'root' } });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await method.run();

        const [, , params] = typedCall.mock.calls[0];
        expect(params.mac).toBe('deadbeef');
        expect(params.device_id).toBe('cafe');
    });

    it('runs offline (no device) by persisting locally and recomputing the root', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(provider.upsert).toHaveBeenCalledWith('bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: expect.any(String),
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
