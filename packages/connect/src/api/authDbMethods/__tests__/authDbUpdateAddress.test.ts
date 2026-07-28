import type { AuthLabelLookupProvider, AuthLabelRow } from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbUpdateAddress from '../api/authDbUpdateAddress';

type MockProvider = AuthLabelLookupProvider;

// The device wallet_id is a bytes field (RIPEMD160(SHA256(master pubkey))), sent as hex
// on the wire; the caller's walletId must equal it (it also scopes local storage) and the
// WM final signature is computed over its raw bytes, so it has to be valid hex here.
const WALLET_ID = 'ab'.repeat(20);

const buildProvider = (overrides: Partial<MockProvider> = {}): MockProvider => ({
    lookup: jest.fn().mockResolvedValue(null),
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

const buildDevice = (typedCall: jest.Mock, setWardProofCallback: jest.Mock = jest.fn()) =>
    ({ getCommands: () => ({ typedCall, setWardProofCallback }) }) as any;

// The high-level method performs an MVP bootstrap-sync first, then drives the WARD
// pull update round (QueueUpdate -> PerformUpdate -> ConfirmedByWM), so the mocked
// typedCall answers each wire message with its matching Ack. The device must echo
// wallet_id (the method binds the WM final signature to it); QueueUpdate returns the
// pending_id and PerformUpdate/ConfirmedByWM carry the candidate/installed root. The
// WARDProofRequest the device would emit during PerformUpdate is answered by the
// callback the method registers via setWardProofCallback (see tests below); with
// typedCall mocked, that exchange does not run here.
const buildWardTypedCall = ({
    counter,
    root,
    walletId = WALLET_ID,
    mac,
    pendingId = 1,
}: {
    counter: number;
    root?: string;
    walletId?: string;
    mac?: string;
    pendingId?: number;
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
            case 'WARDQueueUpdate':
                return Promise.resolve({
                    message: { counter, pending_id: pendingId, wallet_id: walletId },
                });
            case 'WARDPerformUpdate':
                return Promise.resolve({
                    message: { counter, new_root: root, mac, wallet_id: walletId },
                });
            case 'WARDConfirmedByWM':
                return Promise.resolve({
                    message: { counter, new_root: root, wallet_id: walletId, root_mac: mac },
                });
            default:
                throw new Error(`unexpected typedCall for ${requestType}`);
        }
    });

describe('authDbUpdateAddress', () => {
    beforeEach(() => {
        settingsStore.update({ wardDataProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({ device: {} }, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/wardDataProvider/);
    });

    it('inserts a new entry with a non-membership proof and no old_value on the queue step', async () => {
        const existingRows: AuthLabelRow[] = [
            { address: 'bc1qother', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
        ];
        const provider = buildProvider({
            getAllEntries: jest.fn().mockResolvedValue(existingRows),
        });
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = buildWardTypedCall({ counter: 1, root: 'root1' });
        const setWardProofCallback = jest.fn();
        const method = buildMethod({ device: {} }, buildDevice(typedCall, setWardProofCallback));

        const result = await method.run();

        // Intent-only queue: no proof, no counter on the wire — just the new value.
        expect(typedCall).toHaveBeenCalledWith(
            'WARDQueueUpdate',
            'WARDQueueUpdateAck',
            expect.objectContaining({ new_value: expect.any(String) }),
        );
        const [, , queueParams] = typedCall.mock.calls.find(
            ([reqType]) => reqType === 'WARDQueueUpdate',
        )!;
        expect(queueParams.old_value).toBeUndefined();
        expect(queueParams.proof).toBeUndefined(); // pull model: proof is not pushed here

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
        // The whole pull round runs: bootstrap sync -> QueueUpdate -> PerformUpdate -> ConfirmedByWM.
        expect(typedCall).toHaveBeenCalledWith(
            'WARDPerformUpdate',
            'WARDPerformUpdateAck',
            expect.objectContaining({ pending_id: 1 }),
        );
        expect(typedCall).toHaveBeenCalledWith(
            'WARDConfirmedByWM',
            'WARDConfirmedByWMAck',
            expect.objectContaining({
                counter: 1,
                wm_signature: expect.any(String),
                pending_id: 1,
            }),
        );

        // A proof callback was registered for the perform-time pull; for an INSERT it
        // carries the non-membership witness (proof array), not a membership value.
        expect(setWardProofCallback).toHaveBeenCalled();
        const proofCallback = setWardProofCallback.mock.calls[0][0];
        const proofAck = proofCallback({ address: 'aa', pending_id: 1 });
        expect(proofAck.value).toBeUndefined();
        expect(proofAck.proof).toEqual(expect.any(Array));
        // ...and it is cleared afterwards.
        expect(setWardProofCallback).toHaveBeenLastCalledWith(undefined);

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
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = buildWardTypedCall({ counter: 4, root: 'root2' });
        const setWardProofCallback = jest.fn();
        const method = buildMethod({ device: {} }, buildDevice(typedCall, setWardProofCallback));

        await method.run();

        // The queue step carries only the new value; proof/counter are supplied when the
        // device pulls the proof.
        const queueCall = typedCall.mock.calls.find(([reqType]) => reqType === 'WARDQueueUpdate');
        expect(queueCall).toBeDefined();
        const [reqType, , params] = queueCall!;
        expect(reqType).toBe('WARDQueueUpdate');
        expect(params.old_value).toBeUndefined();
        expect(params.new_counter).toBeUndefined(); // device derives the counter now

        // The pulled proof carries the membership value + the leaf's current counter.
        const proofCallback = setWardProofCallback.mock.calls[0][0];
        const proofAck = proofCallback({ address: 'aa', pending_id: 1 });
        expect(proofAck.value).toBeDefined();
        expect(proofAck.witness_address).toBeUndefined();
        expect(proofAck.counter).toBe(3); // previous global stamp of the leaf

        expect(provider.upsert).toHaveBeenCalledWith(WALLET_ID, 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 4,
        });
    });

    it('runs offline (no device) by persisting locally and recomputing the root', async () => {
        const provider = buildProvider();
        settingsStore.update({ wardDataProvider: provider });

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
        settingsStore.update({ wardDataProvider: provider });

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
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = buildWardTypedCall({
            counter: 1,
            root: 'root1',
            walletId: 'otherWallet',
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await expect(method.run()).rejects.toThrow(/does not match requested walletId/);
        // The mismatch is caught during the MVP bootstrap sync, so the WM confirmation
        // must never be sent.
        expect(typedCall).not.toHaveBeenCalledWith(
            'WARDConfirmedByWM',
            expect.anything(),
            expect.anything(),
        );
    });
});
