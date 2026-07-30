import type { WardProvider, WardRow } from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import WardDisplayAddress from '../api/wardDisplayAddress';

// Hex identities: the mock WM signs its attestation preimage over these raw bytes,
// so they must be valid hex (wallet_id 20B, ward_id 32B).
const WALLET_ID = 'ab'.repeat(20);
const WARD_ID = 'cd'.repeat(32);

const buildProvider = (overrides: Partial<WardProvider> = {}): WardProvider => ({
    lookup: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue(undefined),
    getAllEntries: jest.fn().mockResolvedValue([]),
    getTreeState: jest.fn().mockResolvedValue({ root: 'r', counter: 2 }),
    setTreeState: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

const buildMethod = (payload: Record<string, unknown>, deviceInstance?: any) => {
    const method = new WardDisplayAddress({
        payload: {
            method: 'wardDisplayAddress',
            appId: 'btc',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            wardId: WARD_ID,
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

// wardDisplayAddress bootstraps (WARDSync -> IngestAttestation -> Reconcile) so the
// device has a root to verify the label against, then sends DisplayAddress (PULL).
const buildDevice = () => {
    const typedCall = jest.fn().mockImplementation((requestType: string) => {
        switch (requestType) {
            case 'WARDSync':
                return Promise.resolve({
                    message: { nonce: '01', version: 1, wallet_id: WALLET_ID, ward_id: WARD_ID },
                });
            case 'WARDIngestAttestation':
                return Promise.resolve({ message: { counter: 2, wallet_id: WALLET_ID } });
            case 'WARDReconcile':
                return Promise.resolve({
                    message: { counter: 2, new_root: 'r', wallet_id: WALLET_ID },
                });
            case 'DisplayAddress':
                return Promise.resolve({ message: {} }); // Success
            default:
                throw new Error(`unexpected typedCall for ${requestType}`);
        }
    });
    // Keep the last non-undefined proof callback (displayAddress clears it in finally).
    let proofCb: ((req: any) => any) | undefined;
    const setWardProofCallback = jest.fn((cb?: (req: any) => any) => {
        if (cb) proofCb = cb;
    });

    return {
        typedCall,
        setWardProofCallback,
        device: { getCommands: () => ({ typedCall, setWardProofCallback }) } as any,
        getProofCb: () => proofCb,
    };
};

describe('wardDisplayAddress', () => {
    beforeEach(() => {
        settingsStore.update({ wardDataProvider: undefined });
    });

    it('bootstraps, sends DisplayAddress, and answers the pull with a MEMBERSHIP proof', async () => {
        const rows: WardRow[] = [
            {
                appId: 'btc',
                address: 'bc1qaddr',
                networkSymbol: 'btc',
                entry: { metadata: { label: 'x' }, counter: 2 },
            },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: { label: 'x' }, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
        });
        settingsStore.update({ wardDataProvider: provider });

        const dev = buildDevice();
        const result = await buildMethod({ device: {} }, dev.device).run();

        // Bootstrap ran before display.
        expect(dev.typedCall).toHaveBeenCalledWith('WARDSync', 'WARDSyncAck', {});
        // DisplayAddress sent (ward_proof present-but-unused on the PULL path).
        expect(dev.typedCall).toHaveBeenCalledWith(
            'DisplayAddress',
            'Success',
            expect.objectContaining({ address: 'bc1qaddr', ward_proof: [] }),
        );
        // The registered callback answers a WARDProofRequest with a membership proof.
        const ack = dev.getProofCb()!({ address: 'bc1qaddr' });
        expect(ack.value).toEqual(expect.any(String));
        expect(ack.counter).toBe(2);
        expect(dev.setWardProofCallback).toHaveBeenLastCalledWith(undefined);
        expect(result).toEqual({ shown: true, isMember: true });
    });

    it('answers with a NON-MEMBERSHIP proof for an absent address', async () => {
        const rows: WardRow[] = [
            {
                appId: 'btc',
                address: 'bc1qother',
                networkSymbol: 'btc',
                entry: { metadata: {}, counter: 1 },
            },
        ];
        const provider = buildProvider({ getAllEntries: jest.fn().mockResolvedValue(rows) });
        settingsStore.update({ wardDataProvider: provider });

        const dev = buildDevice();
        const result = await buildMethod({ device: {} }, dev.device).run();

        const ack = dev.getProofCb()!({ address: 'bc1qaddr' });
        expect(ack.value).toBeUndefined(); // non-membership carries witness_*, not value
        expect(result).toEqual({ shown: true, isMember: false });
    });

    it('rejects when the device ward_id does not match the requested wardId', async () => {
        settingsStore.update({ wardDataProvider: buildProvider() });
        const dev = buildDevice();
        dev.typedCall.mockImplementationOnce(() =>
            Promise.resolve({
                message: {
                    nonce: '01',
                    version: 1,
                    wallet_id: WALLET_ID,
                    ward_id: 'ee'.repeat(32),
                },
            }),
        );
        await expect(buildMethod({ device: {} }, dev.device).run()).rejects.toThrow(
            /does not match requested wardId/,
        );
    });

    it('requires a device (no offline mode)', async () => {
        settingsStore.update({ wardDataProvider: buildProvider() });
        await expect(buildMethod({}).run()).rejects.toThrow(/requires a device/);
    });
});
