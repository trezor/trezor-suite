import type {
    WalletConnectAccount,
    WalletConnectCallDevice,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import type { TronNetworkSymbol } from '@trezor/network-tron/constants';

import { tronWalletConnectAdapter } from './tronWalletConnectAdapter';

const ADDRESS = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';

const rawData = {
    ref_block_bytes: '0001',
    ref_block_hash: 'hash',
    expiration: 2,
    timestamp: 1,
    fee_limit: 100,
    contract: [],
};

const mockCallDevice = (result: unknown) =>
    // The popup result depends on the method, a fixed result cannot follow it.
    jest.fn(() =>
        Promise.resolve(result),
    ) as unknown as jest.MockedFunction<WalletConnectCallDevice>;

const createAccount = (
    overrides: Partial<WalletConnectAccount<TronNetworkSymbol>> = {},
): WalletConnectAccount<TronNetworkSymbol> => ({
    symbol: 'trx',
    descriptor: ADDRESS,
    path: "m/44'/195'/0'/0/0",
    visible: true,
    identity: 'identity',
    ...overrides,
});

const createContext = (
    method: string,
    params: unknown,
    overrides: Partial<WalletConnectRequestContext<TronNetworkSymbol>> = {},
): WalletConnectRequestContext<TronNetworkSymbol> => ({
    request: { method, params, chainId: 'tron:0x2b6653dc' },
    accounts: [createAccount()],
    sessionSymbol: undefined,
    callDevice: mockCallDevice({
        success: true,
        payload: { signature: 'signature', serialized_tx: 'serialized' },
    }),
    resolveNonce: () => Promise.reject(new Error('Nonce is not expected.')),
    isMevProtectionEnabled: false,
    ...overrides,
});

describe('tronWalletConnectAdapter', () => {
    it('advertises the tron namespace', () => {
        expect(tronWalletConnectAdapter.namespaceId).toBe('tron');
        expect(tronWalletConnectAdapter.getChainIds('trx')).toEqual(['tron:0x2b6653dc']);
        expect(tronWalletConnectAdapter.getChainIds('ttrx')).toEqual([]);
        expect(tronWalletConnectAdapter.getAccountAddress(createAccount())).toBe(ADDRESS);
    });

    it.each([
        ['plain', { raw_data: rawData, txID: 'txid' }, { raw_data: rawData, txID: 'txid' }],
        [
            'legacy',
            { transaction: { raw_data: rawData, txID: 'txid' } },
            { raw_data: rawData, txID: 'txid' },
        ],
    ])('signs a %s transaction', async (_format, transaction, signedTransaction) => {
        const context = createContext('tron_signTransaction', { address: ADDRESS, transaction });

        const result = await tronWalletConnectAdapter.handleRequest(context);

        expect(context.callDevice).toHaveBeenCalledWith('tronSignTransaction', {
            path: "m/44'/195'/0'/0/0",
            ...rawData,
        });
        expect(result).toEqual({ ...signedTransaction, signature: ['signature'] });
    });

    it('does not sign for a hidden account', async () => {
        const context = createContext(
            'tron_signTransaction',
            { address: ADDRESS, transaction: { raw_data: rawData } },
            { accounts: [createAccount({ visible: false })] },
        );

        await expect(tronWalletConnectAdapter.handleRequest(context)).rejects.toThrow(
            `Tron account not found: ${ADDRESS}`,
        );
        expect(context.callDevice).not.toHaveBeenCalled();
    });

    it('rejects message signing', async () => {
        await expect(
            tronWalletConnectAdapter.handleRequest(createContext('tron_signMessage', {})),
        ).rejects.toThrow('Tron message signing is not supported');
    });
});
