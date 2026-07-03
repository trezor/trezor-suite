import type { AuthLabelLookupProvider, AuthLabelRow } from '@trezor/connect-common';

import * as settingsStore from '../../data/settingsStore';
import AuthDbVerifyAddress from '../authDbVerifyAddress';

const buildProvider = (
    overrides: Partial<AuthLabelLookupProvider> = {},
): AuthLabelLookupProvider => ({
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
    const method = new AuthDbVerifyAddress({
        payload: {
            method: 'authDbVerifyAddress',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('authDbVerifyAddress', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('verifies membership against the device', async () => {
        const rows: AuthLabelRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { valid: true, counter: 2, membership: true },
        });
        const method = buildMethod({ device: {} }, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbLookup',
            'AuthDbLookupResponse',
            expect.objectContaining({ value: expect.any(String) }),
        );
        expect(result).toEqual({ isMember: true, valid: true, counter: 2, identifier: undefined });
    });

    it('verifies non-membership against the device', async () => {
        const rows: AuthLabelRow[] = [
            { address: 'bc1qother', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
        ];
        const provider = buildProvider({ getAllEntries: jest.fn().mockResolvedValue(rows) });
        settingsStore.update({ authLabelLookupProvider: provider });

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
        const rows: AuthLabelRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
            getTreeState: jest.fn().mockResolvedValue(null),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(result.isMember).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.counter).toBe(2);
    });

    it('flags an inconsistent local root as invalid offline', async () => {
        const rows: AuthLabelRow[] = [
            { address: 'bc1qaddr', networkSymbol: 'btc', entry: { metadata: {}, counter: 2 } },
        ];
        const provider = buildProvider({
            lookup: jest.fn().mockResolvedValue({ metadata: {}, counter: 2 }),
            getAllEntries: jest.fn().mockResolvedValue(rows),
            getTreeState: jest.fn().mockResolvedValue({ root: 'stale-root', counter: 1 }),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({});
        const result = await method.run();

        expect(result.valid).toBe(false);
    });
});
