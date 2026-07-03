import type { AuthLabelApprovalProvider, AuthLabelLookupProvider } from '@trezor/authdb';

import * as settingsStore from '../../../data/settingsStore';
import AuthDbApproveAddress from '../api/authDbApproveAddress';

type MockProvider = AuthLabelLookupProvider & Partial<AuthLabelApprovalProvider>;

const buildProvider = (overrides: Partial<MockProvider> = {}): MockProvider => ({
    lookup: jest.fn().mockResolvedValue({ metadata: { label: 'x' }, counter: 1 }),
    lookupOrCreate: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
    getAllEntries: jest.fn().mockResolvedValue([]),
    getTreeState: jest.fn().mockResolvedValue(null),
    setTreeState: jest.fn().mockResolvedValue(undefined),
    setApproval: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

const buildMethod = (payload: Record<string, unknown>, deviceInstance?: any) => {
    const method = new AuthDbApproveAddress({
        payload: {
            method: 'authDbApproveAddress',
            address: 'bc1qaddr',
            networkSymbol: 'btc',
            walletId: 'wallet1',
            ...payload,
        } as any,
    });
    if (deviceInstance) method.setDevice(deviceInstance);

    return method;
};

const buildDevice = (typedCall: jest.Mock) => ({ getCommands: () => ({ typedCall }) }) as any;

describe('authDbApproveAddress', () => {
    beforeEach(() => {
        settingsStore.update({ authLabelLookupProvider: undefined });
    });

    it('throws when no provider is configured', async () => {
        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/authLabelLookupProvider/);
    });

    it('throws when the provider does not support approvals', async () => {
        const provider = buildProvider({ setApproval: undefined });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/AuthLabelApprovalProvider/);
    });

    it('throws when the address is not found locally', async () => {
        const provider = buildProvider({ lookup: jest.fn().mockResolvedValue(null) });
        settingsStore.update({ authLabelLookupProvider: provider });

        const method = buildMethod({}, buildDevice(jest.fn()));
        await expect(method.run()).rejects.toThrow(/not found/);
    });

    it('approves the current locally-stored value and persists the approval', async () => {
        const provider = buildProvider();
        settingsStore.update({ authLabelLookupProvider: provider });

        const typedCall = jest.fn().mockResolvedValue({
            message: { mac: 'deadbeef', identifier: 'cafe' },
        });
        const method = buildMethod({}, buildDevice(typedCall));

        const result = await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'AuthDbApprove',
            'AuthDbApproveResponse',
            expect.objectContaining({ address: expect.any(String), value: expect.any(String) }),
        );
        expect(provider.setApproval).toHaveBeenCalledWith(
            'wallet1',
            'bc1qaddr',
            'btc',
            'deadbeef',
            'cafe',
        );
        expect(result).toEqual({ mac: 'deadbeef', deviceId: 'cafe' });
    });
});
