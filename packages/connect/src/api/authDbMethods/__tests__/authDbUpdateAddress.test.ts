import type { AuthLabelLookupProvider, AuthLabelRow } from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbUpdateAddress from '../api/authDbUpdateAddress';

type MockProvider = AuthLabelLookupProvider;

// The device wallet_id is a bytes field (RIPEMD160(SHA256(master pubkey))), sent as hex
// on the wire; the caller's walletId must equal it (it also scopes local storage) and the
// WM final signature is computed over its raw bytes, so it has to be valid hex here.
const WALLET_ID = 'ab'.repeat(20);

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
            walletId: WALLET_ID,
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

// The high-level method performs an MVP bootstrap-sync first, then drives the WARD
// write round (AddPending -> CommitCandidate -> ConfirmCommit),
// so the mocked typedCall answers each wire message with its matching Ack. The device
// must echo wallet_id (the method binds the WM final signature to it), and CommitCandidate/ConfirmCommit
// carry the candidate/installed root.
const buildWardTypedCall = ({
    counter,
    root,
    walletId = WALLET_ID,
    mac,
}: {
    counter: number;
    root?: string;
    walletId?: string;
    mac?: string;
}) =>
    jest.fn().mockImplementation((requestType: string) => {
        switch (requestType) {
            case 'WARDSync':
                return Promise.resolve({
                    message: { nonce: '01', version: 1, wallet_id: walletId },
                });
            case 'WARDIngestAttestation':
                return Promise.resolve({ message: { counter, wallet_id: walletId } });
            case 'WARDReconcile':
                return Promise.resolve({
                    message: { counter, new_root: root, wallet_id: walletId, root_mac: mac },
                });
            case 'WARDAddPending':
                return Promise.resolve({ message: { counter, wallet_id: walletId } });
            case 'WARDCommitCandidate':
                return Promise.resolve({
                    message: { counter, new_root: root, mac, wallet_id: walletId },
                });
            case 'WARDConfirmCommit':
                return Promise.resolve({
                    message: { counter, new_root: root, wallet_id: walletId, root_mac: mac },
                });
            default:
                throw new Error(`unexpected typedCall for ${requestType}`);
        }
    });

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

        const typedCall = buildWardTypedCall({ counter: 1, root: 'root1' });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'WARDAddPending',
            'WARDAddPendingAck',
            // global-counter stamp: empty tree_state -> new_counter = 1
            expect.objectContaining({ old_value: '', proof: expect.any(Array), new_counter: 1 }),
        );
        expect(typedCall).toHaveBeenCalledWith('WARDSync', 'WARDSyncAck', {});
        expect(typedCall).toHaveBeenCalledWith(
            'WARDIngestAttestation',
            'WARDIngestAttestationAck',
            expect.objectContaining({ counter: 0, wm_signature: expect.any(String) }),
        );
        expect(typedCall).toHaveBeenCalledWith(
            'WARDReconcile',
            'WARDReconcileAck',
            expect.any(Object),
        );
        // The whole WARD round runs: bootstrap sync -> AddPending -> CommitCandidate -> ConfirmCommit.
        expect(typedCall).toHaveBeenCalledWith('WARDCommitCandidate', 'WARDCommitCandidateAck', {});
        expect(typedCall).toHaveBeenCalledWith(
            'WARDConfirmCommit',
            'WARDConfirmCommitAck',
            expect.objectContaining({ counter: 1, qm_signature: expect.any(String) }),
        );
        expect(provider.upsert).toHaveBeenCalledWith(WALLET_ID, 'bc1qaddr', 'btc', {
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

        const typedCall = buildWardTypedCall({ counter: 4, root: 'root2' });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await method.run();

        const addPendingCall = typedCall.mock.calls.find(
            ([reqType]) => reqType === 'WARDAddPending',
        );
        expect(addPendingCall).toBeDefined();
        const [reqType, , params] = addPendingCall!;
        expect(reqType).toBe('WARDAddPending');
        expect(params.old_value).not.toBe('');
        expect(params.witness_address).toBeUndefined();
        expect(params.old_counter).toBe(3); // previous global stamp of the leaf
        expect(params.new_counter).toBe(4); // global counter 3 -> 4
        expect(provider.upsert).toHaveBeenCalledWith(WALLET_ID, 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 4,
        });
    });

    it('runs offline (no device) by persisting locally and recomputing the root', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(provider.upsert).toHaveBeenCalledWith(WALLET_ID, 'bc1qaddr', 'btc', {
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

        const typedCall = buildWardTypedCall({ counter: 7, root: 'root7' });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(result).toEqual({
            counter: 7,
            root: 'root7',
            localCacheError: 'disk full',
        });
    });

    it('rejects (before Finalize) when the device wallet_id does not match the requested walletId', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = buildWardTypedCall({
            counter: 1,
            root: 'root1',
            walletId: 'otherWallet',
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await expect(method.run()).rejects.toThrow(/does not match requested walletId/);
        // The mismatch is caught during the MVP bootstrap sync, so Finalize must never be sent.
        expect(typedCall).not.toHaveBeenCalledWith(
            'WARDConfirmCommit',
            expect.anything(),
            expect.anything(),
        );
    });
});
