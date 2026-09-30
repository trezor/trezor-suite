import type { AccountAddresses } from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin/constants';
import type {
    WalletConnectAccount,
    WalletConnectCallDevice,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';

import {
    type BitcoinWalletConnectAdapterDeps,
    createBitcoinWalletConnectAdapter,
} from './createBitcoinWalletConnectAdapter';

const mockCallDevice = (result: unknown) =>
    // The popup result depends on the method, a fixed result cannot follow it.
    jest.fn(() =>
        Promise.resolve(result),
    ) as unknown as jest.MockedFunction<WalletConnectCallDevice>;

const createAddress = (address: string, path: string) => ({
    address,
    path,
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
});

const addresses: AccountAddresses = {
    used: [createAddress('bc1-used', "m/84'/0'/0'/0/0")],
    unused: [createAddress('bc1-unused', "m/84'/0'/0'/0/1")],
    change: [createAddress('bc1-change', "m/84'/0'/0'/1/0")],
};

const createAccount = (overrides: Partial<WalletConnectAccount<BitcoinNetworkSymbol>> = {}) => ({
    symbol: 'btc' as const,
    descriptor: 'zpub-descriptor',
    path: "m/84'/0'/0'",
    visible: true,
    addresses,
    utxo: [],
    identity: 'identity',
    ...overrides,
});

const createDeps = () => {
    const connect = {
        blockchainEstimateFee: jest.fn(),
        composeTransaction: jest.fn(),
        pushTransaction: jest.fn(),
    };
    const deps: BitcoinWalletConnectAdapterDeps = { getTrezorConnect: () => connect };

    return { connect, deps };
};

const createContext = (
    method: string,
    params: unknown,
    overrides: Partial<WalletConnectRequestContext<BitcoinNetworkSymbol>> = {},
): WalletConnectRequestContext<BitcoinNetworkSymbol> => ({
    request: { method, params, chainId: 'bip122:000000000019d6689c085ae165831e93' },
    accounts: [createAccount()],
    sessionSymbol: undefined,
    callDevice: jest.fn(() => Promise.reject(new Error('Device is not expected.'))),
    resolveNonce: () => Promise.reject(new Error('Nonce is not expected.')),
    isMevProtectionEnabled: false,
    ...overrides,
});

describe('createBitcoinWalletConnectAdapter', () => {
    it('advertises the bip122 namespace', () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        expect(adapter.namespaceId).toBe('bip122');
        expect(adapter.methods).toEqual(['sendTransfer', 'signMessage', 'getAccountAddresses']);
        expect(adapter.events).toEqual(['accountsChanged']);
    });

    it.each<[BitcoinNetworkSymbol, string[]]>([
        ['btc', ['bip122:000000000019d6689c085ae165831e93']],
        ['test', ['bip122:000000000933ea01ad0ee984209779ba']],
        ['regtest', []],
    ])('returns the chain IDs of %s', (symbol, chainIds) => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        expect(adapter.getChainIds(symbol)).toEqual(chainIds);
    });

    it('names the account by its first receive address', () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        expect(adapter.getAccountAddress(createAccount())).toBe('bc1-used');
        expect(adapter.getAccountAddress(createAccount({ addresses: undefined }))).toBeUndefined();
    });

    it('lists all addresses of the account', async () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        const result = await adapter.handleRequest(
            createContext('getAccountAddresses', { account: 'bc1-unused' }),
        );

        expect(result).toEqual(
            ['bc1-used', 'bc1-change', 'bc1-unused'].map(address => ({
                address,
                publicKey: 'zpub-descriptor',
                path: "m/84'/0'/0'",
            })),
        );
    });

    it('returns nothing for an unknown account', async () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        const result = await adapter.handleRequest(
            createContext('getAccountAddresses', { account: 'bc1-foreign' }),
        );

        expect(result).toBeUndefined();
    });

    it('signs a message with the requested address', async () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);
        const callDevice = mockCallDevice({
            success: true,
            payload: { address: 'bc1-change', signature: 'signature' },
        });

        const result = await adapter.handleRequest(
            createContext(
                'signMessage',
                { account: 'bc1-used', message: '48656c6c6f', address: 'bc1-change' },
                { callDevice },
            ),
        );

        expect(callDevice).toHaveBeenCalledWith('signMessage', {
            path: "m/84'/0'/0'/1/0",
            coin: 'btc',
            message: '48656c6c6f',
            hex: true,
        });
        expect(result).toEqual({ signature: 'signature', address: 'bc1-change' });
    });

    it('rejects a message signature the user declined', async () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);
        const callDevice = jest.fn(() =>
            Promise.resolve({
                success: false as const,
                error: { message: 'Cancelled', code: 'Method_Cancel' as const },
            }),
        );
        jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(
            adapter.handleRequest(
                createContext(
                    'signMessage',
                    { account: 'bc1-used', message: '00' },
                    { callDevice },
                ),
            ),
        ).rejects.toThrow('signMessage error');
    });

    it('composes, signs and broadcasts a transfer', async () => {
        const { connect, deps } = createDeps();
        const adapter = createBitcoinWalletConnectAdapter(deps);
        const levels = [{ label: 'normal', feePerUnit: '1', blocks: 1 }];
        const final = { type: 'final', inputs: ['input'], outputs: ['output'] };
        connect.blockchainEstimateFee.mockResolvedValue({ success: true, payload: { levels } });
        connect.composeTransaction.mockResolvedValue({ success: true, payload: [final] });
        connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: 'txid' } });
        const callDevice = mockCallDevice({
            success: true,
            payload: { serializedTx: 'serialized' },
        });

        const result = await adapter.handleRequest(
            createContext(
                'sendTransfer',
                {
                    account: 'bc1-used',
                    recipientAddress: 'bc1-recipient',
                    amount: '1000',
                    changeAddress: 'bc1-change',
                    memo: '6d656d6f',
                },
                { callDevice },
            ),
        );

        expect(connect.blockchainEstimateFee).toHaveBeenCalledWith({
            coin: 'btc',
            identity: 'identity',
            request: { blocks: [1] },
        });
        expect(connect.composeTransaction).toHaveBeenCalledWith({
            outputs: [
                { type: 'payment', address: 'bc1-recipient', amount: '1000' },
                { type: 'opreturn', dataHex: '6d656d6f' },
                { type: 'send-max', address: 'bc1-change' },
            ],
            coin: 'btc',
            account: { path: "m/84'/0'/0'", addresses, utxo: [] },
            feeLevels: levels,
        });
        expect(callDevice).toHaveBeenCalledWith('signTransaction', {
            inputs: ['input'],
            outputs: ['output'],
            account: { addresses },
            coin: 'btc',
            chunkify: true,
            unlockPath: undefined,
            version: 2,
        });
        expect(connect.pushTransaction).toHaveBeenCalledWith({
            coin: 'btc',
            identity: 'identity',
            tx: 'serialized',
        });
        expect(result).toEqual({ txid: 'txid' });
    });

    it('does not sign a transfer that cannot be composed', async () => {
        const { connect, deps } = createDeps();
        const adapter = createBitcoinWalletConnectAdapter(deps);
        connect.blockchainEstimateFee.mockResolvedValue({ success: true, payload: { levels: [] } });
        connect.composeTransaction.mockResolvedValue({
            success: true,
            payload: [{ type: 'error', error: 'NOT-ENOUGH-FUNDS' }],
        });
        const context = createContext('sendTransfer', {
            account: 'bc1-used',
            recipientAddress: 'bc1-recipient',
            amount: '1000',
        });
        jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(adapter.handleRequest(context)).rejects.toThrow('composeTransaction error');
        expect(context.callDevice).not.toHaveBeenCalled();
    });

    it('rejects methods of other namespaces', async () => {
        const adapter = createBitcoinWalletConnectAdapter(createDeps().deps);

        await expect(adapter.handleRequest(createContext('signPsbt', {}))).rejects.toThrow(
            'Unsupported method: signPsbt',
        );
    });
});
