import type {
    WalletConnectAccount,
    WalletConnectCallDevice,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';

import {
    type SolanaWalletConnectAdapterDeps,
    createSolanaWalletConnectAdapter,
} from './createSolanaWalletConnectAdapter';

const mockCallDevice = (result: unknown) =>
    // The popup result depends on the method, a fixed result cannot follow it.
    jest.fn(() =>
        Promise.resolve(result),
    ) as unknown as jest.MockedFunction<WalletConnectCallDevice>;

const createAccount = (
    overrides: Partial<WalletConnectAccount<SolanaNetworkSymbol>> = {},
): WalletConnectAccount<SolanaNetworkSymbol> => ({
    symbol: 'sol',
    descriptor: 'payer',
    path: "m/44'/501'/0'/0'",
    visible: true,
    identity: 'identity',
    ...overrides,
});

const createDeps = () => {
    const connect = {
        blockchainEstimateFee: jest.fn(),
        pushTransaction: jest.fn(),
    };
    const deps: SolanaWalletConnectAdapterDeps = { getTrezorConnect: () => connect };

    return { connect, deps };
};

const createContext = (
    method: string,
    params: unknown,
    overrides: Partial<WalletConnectRequestContext<SolanaNetworkSymbol>> = {},
): WalletConnectRequestContext<SolanaNetworkSymbol> => ({
    request: { method, params, chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' },
    accounts: [createAccount(), createAccount({ descriptor: 'hidden', visible: false })],
    sessionSymbol: 'sol',
    callDevice: mockCallDevice({
        success: true,
        payload: { signature: '0102', serializedTx: 'signed' },
    }),
    resolveNonce: () => Promise.reject(new Error('Nonce is not expected.')),
    isMevProtectionEnabled: false,
    ...overrides,
});

// Base64 of the bytes 0xabcd.
const TRANSACTION = 'q80=';

describe('createSolanaWalletConnectAdapter', () => {
    it('advertises the solana namespace', () => {
        const adapter = createSolanaWalletConnectAdapter(createDeps().deps);

        expect(adapter.namespaceId).toBe('solana');
        expect(adapter.getChainIds('sol')).toEqual([
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
        ]);
        expect(adapter.getChainIds('dsol')).toEqual(['solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1']);
        expect(adapter.getAccountAddress(createAccount())).toBe('payer');
    });

    it.each(['solana_getAccounts', 'solana_requestAccounts'])(
        'lists the visible accounts on %s',
        async method => {
            const adapter = createSolanaWalletConnectAdapter(createDeps().deps);

            await expect(adapter.handleRequest(createContext(method, {}))).resolves.toEqual([
                { pubkey: 'payer' },
            ]);
        },
    );

    it('signs a transaction of the fee payer', async () => {
        const { connect, deps } = createDeps();
        const adapter = createSolanaWalletConnectAdapter(deps);
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feePayer: 'hidden' }] },
        });
        const context = createContext('solana_signTransaction', {
            transaction: TRANSACTION,
            feePayer: 'payer',
        });

        const result = await adapter.handleRequest(context);

        expect(connect.blockchainEstimateFee).toHaveBeenCalledWith({
            coin: 'sol',
            request: { specific: { data: 'abcd' } },
        });
        expect(context.callDevice).toHaveBeenCalledWith('solanaSignTransaction', {
            path: "m/44'/501'/0'/0'",
            serializedTx: 'abcd',
            serialize: true,
            additionalInfo: { isDevnet: false },
        });
        // Base58 of the bytes 0x0102.
        expect(result).toEqual({ signature: '5T' });
    });

    it('takes the fee payer from the estimate and broadcasts on devnet', async () => {
        const { connect, deps } = createDeps();
        const adapter = createSolanaWalletConnectAdapter(deps);
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feePayer: 'payer' }] },
        });
        connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: 'txid' } });
        const context = createContext(
            'solana_signAndSendTransaction',
            { transaction: TRANSACTION },
            { sessionSymbol: 'dsol' },
        );

        const result = await adapter.handleRequest(context);

        expect(context.callDevice).toHaveBeenCalledWith(
            'solanaSignTransaction',
            expect.objectContaining({ additionalInfo: { isDevnet: true } }),
        );
        expect(connect.pushTransaction).toHaveBeenCalledWith({ coin: 'dsol', tx: 'signed' });
        expect(result).toEqual({ signature: 'txid' });
    });

    it('does not sign for a hidden fee payer', async () => {
        const { connect, deps } = createDeps();
        const adapter = createSolanaWalletConnectAdapter(deps);
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feePayer: 'hidden' }] },
        });
        const context = createContext('solana_signTransaction', { transaction: TRANSACTION });

        await expect(adapter.handleRequest(context)).rejects.toThrow('Account not found');
        expect(context.callDevice).not.toHaveBeenCalled();
    });

    it('rejects message signing', async () => {
        const adapter = createSolanaWalletConnectAdapter(createDeps().deps);

        await expect(
            adapter.handleRequest(createContext('solana_signMessage', {})),
        ).rejects.toThrow('Solana message signing is not supported');
    });
});
