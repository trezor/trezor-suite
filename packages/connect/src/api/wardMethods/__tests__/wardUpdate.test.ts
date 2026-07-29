import { bytesToHex } from '@noble/hashes/utils.js';

import type { WardProvider, WardRow } from '@trezor/ward';
import { entryToValueBytes } from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import WardUpdate from '../api/wardUpdate';
import {
    type WardManagerService,
    getWardManagerService,
    setWardManagerService,
} from '../wardManagerService';

type MockProvider = WardProvider;

// The device wallet_id is a bytes field (RIPEMD160(SHA256(master pubkey))), sent as hex
// on the wire; the caller's walletId must equal it (it also scopes local storage) and the
// WM final signature is computed over its raw bytes, so it has to be valid hex here.
const WALLET_ID = 'ab'.repeat(20);
// The device ward_id is the SLIP21-derived WM anchor (32 bytes), sent as hex. The WM
// signs its ATTEST/FINAL preimages over this value, so the device echoes it on
// WARDSyncAck / WARDPerformUpdateAck and the host forwards it to the WM.
const WARD_ID = 'cd'.repeat(32);

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
    const method = new WardUpdate({
        payload: {
            method: 'wardUpdate',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            metadata: { label: 'x' },
            wardId: WARD_ID,
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
    wardId = WARD_ID,
    mac,
    pendingId = 1,
    performCounter,
}: {
    counter: number;
    root?: string;
    walletId?: string;
    wardId?: string;
    mac?: string;
    pendingId?: number;
    // The counter the device derives at perform/confirm; defaults to `counter`. Set
    // it distinct from any host guess to prove the host persists the DEVICE counter.
    performCounter?: number;
}) =>
    jest.fn().mockImplementation((requestType: string) => {
        const devCounter = performCounter ?? counter;
        switch (requestType) {
            case 'WARDSync':
                return Promise.resolve({
                    message: { nonce: '01', version: 1, wallet_id: walletId, ward_id: wardId },
                });
            case 'WARDIngestAttestation':
                return Promise.resolve({ message: { counter, wallet_id: walletId } });
            case 'WARDReconcile':
                return Promise.resolve({
                    message: { counter, new_root: root, wallet_id: walletId, root_mac: mac },
                });
            case 'WARDQueueUpdate':
                return Promise.resolve({
                    message: { pending_id: pendingId, wallet_id: walletId },
                });
            case 'WARDPerformUpdate':
                return Promise.resolve({
                    message: {
                        counter: devCounter,
                        new_root: root,
                        mac,
                        wallet_id: walletId,
                        ward_id: wardId,
                    },
                });
            case 'WARDConfirmedByWM':
                return Promise.resolve({
                    message: {
                        counter: devCounter,
                        new_root: root,
                        wallet_id: walletId,
                        root_mac: mac,
                    },
                });
            default:
                throw new Error(`unexpected typedCall for ${requestType}`);
        }
    });

describe('wardUpdate', () => {
    beforeEach(() => {
        settingsStore.update({ wardDataProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({ device: {} }, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/wardDataProvider/);
    });

    it('inserts a new entry with a non-membership proof and no old_value on the queue step', async () => {
        const existingRows: WardRow[] = [
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

        expect(provider.upsert).toHaveBeenCalledWith(WARD_ID, 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 1,
        });
        expect(result).toEqual({ counter: 1, root: 'root1' });
    });

    it('updates an existing entry, stamping the new leaf with the global counter + 1', async () => {
        const existingRows: WardRow[] = [
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

        expect(provider.upsert).toHaveBeenCalledWith(WARD_ID, 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 4,
        });
    });

    it('runs offline (no device) by persisting locally and recomputing the root', async () => {
        const provider = buildProvider();
        settingsStore.update({ wardDataProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(provider.upsert).toHaveBeenCalledWith(WARD_ID, 'bc1qaddr', 'btc', {
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

    it('rejects (before Finalize) when the device ward_id does not match the requested wardId', async () => {
        const provider = buildProvider();
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = buildWardTypedCall({
            counter: 1,
            root: 'root1',
            wardId: 'ee'.repeat(32), // device echoes a different ward_id than requested
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await expect(method.run()).rejects.toThrow(/does not match requested wardId/);
        // The mismatch is caught during the MVP bootstrap sync, so the WM confirmation
        // must never be sent.
        expect(typedCall).not.toHaveBeenCalledWith(
            'WARDConfirmedByWM',
            expect.anything(),
            expect.anything(),
        );
    });

    // --- strict counter model + spec-strict wardId regressions ---

    it('persists the DEVICE-derived counter, not the host guess', async () => {
        const provider = buildProvider({
            // host guess would be currentTreeState.counter + 1 = 4 ...
            getTreeState: jest.fn().mockResolvedValue({ root: 'r', counter: 3 }),
        });
        settingsStore.update({ wardDataProvider: provider });

        // ... but the device derives and confirms counter 9. That is what must persist.
        const typedCall = buildWardTypedCall({ counter: 3, root: 'root9', performCounter: 9 });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(provider.upsert).toHaveBeenCalledWith(WARD_ID, 'bc1qaddr', 'btc', {
            metadata: { label: 'x' },
            counter: 9,
        });
        expect(provider.setTreeState).toHaveBeenCalledWith(
            WARD_ID,
            expect.objectContaining({ counter: 9 }),
        );
        expect(result.counter).toBe(9);
    });

    it('sends a counter-free new_value on WARDQueueUpdate (host never injects a counter)', async () => {
        const provider = buildProvider({
            getTreeState: jest.fn().mockResolvedValue({ root: 'r', counter: 3 }),
        });
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = buildWardTypedCall({ counter: 3, root: 'root4', performCounter: 4 });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));
        await method.run();

        const [, , params] = typedCall.mock.calls.find(
            ([reqType]) => reqType === 'WARDQueueUpdate',
        )!;
        // The value bytes are independent of the counter: they equal the encoding for
        // ANY counter, proving the counter is not baked into new_value.
        const expected = bytesToHex(
            entryToValueBytes('btc', { metadata: { label: 'x' }, counter: 123456 }),
        );
        expect(params.new_value).toBe(expected);
    });

    it('forwards the device ward_id (not wallet_id) to the WM for attest and commit', async () => {
        const provider = buildProvider();
        settingsStore.update({ wardDataProvider: provider });

        const attestArgs: any[] = [];
        const candidateArgs: any[] = [];
        const original = getWardManagerService();
        const spyService: WardManagerService = {
            signAttestation: c => {
                attestArgs.push(c);

                return Promise.resolve('deadbeef');
            },
            signCandidate: c => {
                candidateArgs.push(c);

                return Promise.resolve('deadbeef');
            },
        };
        setWardManagerService(spyService);
        try {
            const typedCall = buildWardTypedCall({ counter: 1, root: 'root1' });
            const method = buildMethod({ device: {} }, buildDevice(typedCall));
            await method.run();
        } finally {
            setWardManagerService(original);
        }

        expect(attestArgs).toHaveLength(1);
        expect(candidateArgs).toHaveLength(1);
        expect(attestArgs[0].wardId).toBe(WARD_ID);
        expect(candidateArgs[0].wardId).toBe(WARD_ID);
        // The WM identity is the 32-byte ward_id, never the 20-byte wallet_id ...
        expect(attestArgs[0].wardId).not.toBe(WALLET_ID);
        // ... and no ownerId leaks into the WM call.
        expect(attestArgs[0].ownerId).toBeUndefined();
        expect(candidateArgs[0].ownerId).toBeUndefined();
    });
});
