import { base58 } from '@scure/base';

import type { GetTrezorConnectDep } from '@trezor/connect-common';
import type {
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';

import { getNetworkConfig } from '../networkConfig';

export type SolanaWalletConnectAdapterDeps = GetTrezorConnectDep<
    'blockchainEstimateFee' | 'pushTransaction'
>;

export type SolanaWalletConnectAdapter = WalletConnectAdapter<SolanaNetworkSymbol>;

type SolanaContext = WalletConnectRequestContext<SolanaNetworkSymbol>;

type SignTransactionParams = { transaction: string; feePayer?: string };

const methods = [
    'solana_getAccounts',
    'solana_requestAccounts',
    'solana_signTransaction',
    'solana_signAndSendTransaction',
    'solana_signMessage',
];

// https://github.com/reown-com/blockchain-api/blob/master/SUPPORTED_CHAINS.md#solana
const SolanaChainId = {
    MAINNET: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    TESTNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    MAINNET_LEGACY: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
} as const;

const getChainIds = (symbol: SolanaNetworkSymbol) =>
    getNetworkConfig(symbol).testnet
        ? [SolanaChainId.TESTNET]
        : [SolanaChainId.MAINNET, SolanaChainId.MAINNET_LEGACY];

const getSessionSymbol = (context: SolanaContext): SolanaNetworkSymbol =>
    context.sessionSymbol === 'dsol' ? 'dsol' : 'sol';

type SignTransactionDeps = SolanaWalletConnectAdapterDeps;

type SignSolanaTransactionParams = { context: SolanaContext } & SignTransactionParams;

type SignTransaction = (
    params: SignSolanaTransactionParams,
) => Promise<{ signature: string; transaction: string }>;

const createSignTransaction =
    (deps: SignTransactionDeps): SignTransaction =>
    async ({ context, transaction, feePayer }) => {
        const symbol = getSessionSymbol(context);
        const serializedTx = Buffer.from(transaction, 'base64').toString('hex');

        const estimatedFee = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: symbol,
            request: { specific: { data: serializedTx } },
        });
        if (!estimatedFee.success) {
            throw new Error('Failed to estimate fee. ' + estimatedFee.error.message);
        }

        // The dApp may leave the fee payer out, the estimate decodes it from the transaction.
        const [feeLevel] = estimatedFee.payload.levels;
        const signer = feePayer || feeLevel?.feePayer;
        const account = context.accounts.find(a => a.visible && a.descriptor === signer);
        if (!account) {
            throw new Error('Account not found');
        }

        const response = await context.callDevice('solanaSignTransaction', {
            path: account.path,
            serializedTx,
            serialize: true,
            additionalInfo: { isDevnet: symbol === 'dsol' },
        });
        if (!response.success || !response.payload.serializedTx) {
            console.error('solana_signTransaction error', response);
            throw new Error('Solana signing error');
        }

        return {
            signature: response.payload.signature,
            transaction: response.payload.serializedTx,
        };
    };

export const createSolanaWalletConnectAdapter = (
    deps: SolanaWalletConnectAdapterDeps,
): SolanaWalletConnectAdapter => {
    const signTransaction = createSignTransaction(deps);

    return {
        namespaceId: 'solana',
        methods,
        events: ['accountsChanged'],
        getChainIds,
        getAccountAddress: account => account.descriptor,
        handleRequest: async context => {
            switch (context.request.method) {
                case 'solana_getAccounts':
                case 'solana_requestAccounts':
                    return context.accounts
                        .filter(account => account.visible)
                        .map(account => ({ pubkey: account.descriptor }));
                case 'solana_signTransaction': {
                    const params = context.request.params as SignTransactionParams;
                    const response = await signTransaction({ context, ...params });

                    return { signature: base58.encode(Buffer.from(response.signature, 'hex')) };
                }
                case 'solana_signAndSendTransaction': {
                    const { transaction } = context.request.params as SignTransactionParams;
                    const response = await signTransaction({ context, transaction });

                    const pushResponse = await deps.getTrezorConnect().pushTransaction({
                        coin: getSessionSymbol(context),
                        tx: response.transaction,
                    });
                    if (!pushResponse.success) {
                        console.error('solana_signAndSendTransaction push error', pushResponse);
                        throw new Error('Solana transaction push error');
                    }

                    return { signature: pushResponse.payload.txid };
                }
                case 'solana_signMessage':
                    // Firmware cannot sign arbitrary Solana messages. The method is advertised
                    // because some dApps require it without using it.
                    throw new Error('Solana message signing is not supported');
                default:
                    throw new Error(`Unsupported method: ${context.request.method}`);
            }
        },
    };
};
