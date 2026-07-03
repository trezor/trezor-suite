import type { AuthLabelLookupProvider } from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbFastForwardRoot from '../api/authDbFastForwardRoot';

const buildProvider = (
    overrides: Partial<AuthLabelLookupProvider> = {},
): AuthLabelLookupProvider => ({
    lookup: jest.fn().mockResolvedValue(null),
    lookupOrCreate: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
    getAllEntries: jest.fn().mockResolvedValue([]),
    getTreeState: jest.fn().mockResolvedValue({ root: 'root1', counter: 3 }),
    setTreeState: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

const buildMethod = (payload: Record<string, unknown>, deviceInstance?: any) => {
    const method = new AuthDbFastForwardRoot({
        payload: {
            method: 'authDbFastForwardRoot',
            walletId: 'wallet1',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('authDbFastForwardRoot', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/authLabelLookupProvider/);
    });

    it('throws when no root is stored for the wallet', async () => {
        const provider = buildProvider({ getTreeState: jest.fn().mockResolvedValue(null) });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/no stored root/);
    });

    it('sends the stored root and persists the device-confirmed counter', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 5, identifier: 'device-1' },
        });
        const method = buildMethod({}, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbSetRoot',
            'AuthDbSetRootResponse',
            expect.objectContaining({ root: 'root1' }),
        );
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: 'root1',
            counter: 5,
            mac: undefined,
            deviceId: undefined,
        });
        expect(result).toEqual({ counter: 5, identifier: 'device-1' });
    });

    it('forwards mac/deviceId from the stored checkpoint when present', async () => {
        const provider = buildProvider({
            getTreeState: jest
                .fn()
                .mockResolvedValue({
                    root: 'root2',
                    counter: 1,
                    mac: 'deadbeef',
                    deviceId: 'cafe',
                }),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({ message: { counter: 2 } });
        const method = buildMethod({}, buildDevice(typedCall));

        await method.run();

        const [, , params] = typedCall.mock.calls[0];
        expect(params.mac).toBe('deadbeef');
        expect(params.device_id).toBe('cafe');
    });
});
