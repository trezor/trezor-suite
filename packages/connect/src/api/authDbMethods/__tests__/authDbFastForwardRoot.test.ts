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
    getTreeState: jest.fn().mockResolvedValue({ root: 'root1', counter: 3, mac: 'attest1' }),
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

    it('throws when the stored checkpoint has no root-attestation token', async () => {
        const provider = buildProvider({
            getTreeState: jest.fn().mockResolvedValue({ root: 'root1', counter: 3 }),
        });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/root-attestation token/);
    });

    it('sends the stored checkpoint via AuthDbFastForwardRoot and persists the result', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { counter: 5, new_root: 'root1', wallet_id: 'wallet1' },
        });
        const method = buildMethod({}, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbFastForwardRoot',
            'AuthDbFastForwardRootResponse',
            {
                new_root: 'root1',
                counter: 3,
                wallet_id: 'wallet1',
                mac: 'attest1',
            },
        );
        expect(provider.setTreeState).toHaveBeenCalledWith('wallet1', {
            root: 'root1',
            counter: 5,
            mac: 'attest1',
        });
        expect(result).toEqual({ counter: 5, walletId: 'wallet1' });
    });
});
