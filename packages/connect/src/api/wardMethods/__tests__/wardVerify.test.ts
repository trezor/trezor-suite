import type { WardProvider, WardRow } from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import WardVerify from '../api/wardVerify';

// Hex identities: wardVerify now bootstraps (WARDSync -> Ingest -> Reconcile) before
// WARDLookup, and the mock WM signs its attestation over the raw bytes, so wardId must
// be valid hex.
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
    const method = new WardVerify({
        payload: {
            method: 'wardVerify',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            wardId: WARD_ID,
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

// Device mock answering the bootstrap sync round + the WARDLookup. `lookupAck` overrides
// the WARDLookup response; `syncWardId` overrides the ward_id echoed at WARDSync.
const buildDevice = (lookupAck: Record<string, unknown>, syncWardId: string = WARD_ID) => {
    const typedCall = jest.fn().mockImplementation((requestType: string) => {
        switch (requestType) {
            case 'WARDSync':
                return Promise.resolve({
                    message: { nonce: '01', version: 1, wallet_id: WALLET_ID, ward_id: syncWardId },
                });
            case 'WARDIngestAttestation':
                return Promise.resolve({ message: { counter: 2, wallet_id: WALLET_ID } });
            case 'WARDReconcile':
                return Promise.resolve({
                    message: { counter: 2, new_root: 'r', wallet_id: WALLET_ID },
                });
            case 'WARDLookup':
                return Promise.resolve({ message: lookupAck });
            default:
                throw new Error(`unexpected typedCall for ${requestType}`);
        }
    });

    return { typedCall, device: { getCommands: () => ({ typedCall }) } as any };
};

describe('wardVerify', () => {
    beforeEach(() => {
        settingsStore.update({ wardDataProvider: undefined });
    });

    it('bootstraps then verifies membership against the device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        settingsStore.update({
            wardDataProvider: buildProvider({
                lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
                getAllEntries: jest.fn().mockResolvedValue(rows),
            }),
        });

        const dev = buildDevice({ valid: true, counter: 2, membership: true, ward_id: WARD_ID });
        const result = await buildMethod({ device: {} }, dev.device).run();

        expect(dev.typedCall).toHaveBeenCalledWith('WARDSync', 'WARDSyncAck', {});
        expect(dev.typedCall).toHaveBeenCalledWith(
            'WARDLookup',
            'WARDLookupAck',
            expect.objectContaining({ value: expect.any(String) }),
        );
        expect(result).toEqual({ isMember: true, valid: true, counter: 2, wardId: WARD_ID });
    });

    it('rejects (at bootstrap) when the device ward_id does not match the requested wardId', async () => {
        settingsStore.update({
            wardDataProvider: buildProvider({
                lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
                getAllEntries: jest
                    .fn()
                    .mockResolvedValue([
                        {
                            address: 'bc1qaddr',
                            networkSymbol: 'btc',
                            entry: { metadata: {}, counter: 2 },
                        },
                    ]),
            }),
        });

        const dev = buildDevice({ valid: true }, 'ee'.repeat(32));
        await expect(buildMethod({ device: {} }, dev.device).run()).rejects.toThrow(
            /does not match requested wardId/,
        );
        // Mismatch caught during bootstrap — WARDLookup must never be sent.
        expect(dev.typedCall).not.toHaveBeenCalledWith(
            'WARDLookup',
            expect.anything(),
            expect.anything(),
        );
    });

    it('verifies non-membership against the device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qother', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
        ];
        settingsStore.update({
            wardDataProvider: buildProvider({ getAllEntries: jest.fn().mockResolvedValue(rows) }),
        });

        const dev = buildDevice({ valid: true, counter: 1, membership: false });
        const result = await buildMethod({ device: {} }, dev.device).run();

        const [, , params] = dev.typedCall.mock.calls.find(([r]) => r === 'WARDLookup')!;
        expect(params.value).toBeUndefined();
        expect(result.isMember).toBe(false);
    });

    it('verifies local consistency offline without a device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        settingsStore.update({
            wardDataProvider: buildProvider({
                lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
                getAllEntries: jest.fn().mockResolvedValue(rows),
                getTreeState: jest.fn().mockResolvedValue(null),
            }),
        });

        const result = await buildMethod({}).run();

        expect(result.isMember).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.counter).toBe(2);
    });

    it('flags an inconsistent local root as invalid offline', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        settingsStore.update({
            wardDataProvider: buildProvider({
                lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
                getAllEntries: jest.fn().mockResolvedValue(rows),
                getTreeState: jest.fn().mockResolvedValue({ root: 'stale-root', counter: 1 }),
            }),
        });

        const result = await buildMethod({}).run();
        expect(result.valid).toBe(false);
    });
});
