import type { WardProvider, WardRow } from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import WardVerify from '../api/wardVerify';

const buildProvider = (overrides: Partial<WardProvider> = {}): WardProvider => ({
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
    const method = new WardVerify({
        payload: {
            method: 'wardVerify',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            wardId: 'ward1',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('wardVerify', () => {
    beforeEach(() => {
        settingsStore.update({ wardDataProvider: undefined });
    });

    it('verifies membership against the device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
        });
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { valid: true, counter: 2, membership: true, ward_id: 'ward1' },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'WARDLookup',
            'WARDLookupAck',
            expect.objectContaining({ value: expect.any(String) }),
        );
        expect(result).toEqual({ isMember: true, valid: true, counter: 2, wardId: 'ward1' });
    });

    it('rejects when the device ward_id does not match the requested wardId', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
        });
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { valid: true, counter: 2, membership: true, ward_id: 'otherWard' },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        await expect(method.run()).rejects.toThrow(/does not match requested wardId/);
    });

    it('verifies non-membership against the device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qother', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
        ];
        const provider = buildProvider({ getAllEntries: jest.fn().mockResolvedValue(rows) });
        settingsStore.update({ wardDataProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { valid: true, counter: 1, membership: false },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        const [, , params] = typedCall.mock.calls[0];
        expect(params.value).toBeUndefined();
        expect(result.isMember).toBe(false);
    });

    it('verifies local consistency offline without a device', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
            getTreeState: jest.fn().mockResolvedValue(null),
        });
        settingsStore.update({ wardDataProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(result.isMember).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.counter).toBe(2);
    });

    it('flags an inconsistent local root as invalid offline', async () => {
        const rows: WardRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
            getTreeState: jest.fn().mockResolvedValue({ root: 'stale-root', counter: 1 }),
        });
        settingsStore.update({ wardDataProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(result.valid).toBe(false);
    });
});
