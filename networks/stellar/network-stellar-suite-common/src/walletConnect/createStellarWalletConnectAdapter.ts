import { type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';
import type {
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import {
    type StellarNetworkSymbol,
    supportedStellarNetworks,
} from '@trezor/network-stellar/constants';
import loadStellar from '@trezor/network-stellar/runtime';

import { getNetworkConfig } from '../networkConfig';

export type StellarWalletConnectAdapterDeps = GetTrezorConnectDep<'pushTransaction'>;

export type StellarWalletConnectAdapter = WalletConnectAdapter<StellarNetworkSymbol>;

type StellarContext = WalletConnectRequestContext<StellarNetworkSymbol>;

type SignXDRParams = { xdr: string };

const methods = ['stellar_signXDR', 'stellar_signAndSubmitXDR'];

const getChainIds = (symbol: StellarNetworkSymbol) => {
    const { caipId } = getNetworkConfig(symbol);

    return caipId ? [caipId] : [];
};

const getRequestSymbol = (context: StellarContext) => {
    const { chainId } = context.request;
    const symbol = supportedStellarNetworks.find(s => getChainIds(s).includes(chainId));
    if (!symbol) {
        throw new Error(`Unsupported Stellar chain: ${chainId}`);
    }

    return symbol;
};

const signXDR = async (context: StellarContext) => {
    const { xdr } = context.request.params as SignXDRParams;
    const { testnet } = getNetworkConfig(getRequestSymbol(context));

    const { parseTransactionFromXDR } = await loadStellar();
    const transaction = parseTransactionFromXDR(xdr, testnet);

    const account = context.accounts.find(a => a.visible && a.descriptor === transaction.source);
    if (!account) {
        throw new Error('Account not found');
    }

    const response = await context.callDevice('stellarSignTransaction', {
        xdrBase64: xdr,
        testnet,
        path: account.path,
    });
    if (!response.success) {
        console.error('stellar_signXDR error', response);
        throw new Error('Stellar signing error');
    }

    const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
    transaction.addSignature(account.descriptor, signature);

    return { signedXDR: transaction.toEnvelope().toXdr('base64') };
};

export const createStellarWalletConnectAdapter = (
    deps: StellarWalletConnectAdapterDeps,
): StellarWalletConnectAdapter => ({
    namespaceId: 'stellar',
    methods,
    events: ['accountsChanged'],
    getChainIds,
    getAccountAddress: account => account.descriptor,
    // See https://docs.reown.com/advanced/multichain/rpc-reference/stellar-rpc
    handleRequest: async context => {
        switch (context.request.method) {
            case 'stellar_signXDR':
                return await signXDR(context);
            case 'stellar_signAndSubmitXDR': {
                const symbol = getRequestSymbol(context);
                const { signedXDR } = await signXDR(context);

                const pushResponse = await deps.getTrezorConnect().pushTransaction({
                    coin: asCoinSymbol(symbol),
                    tx: Buffer.from(signedXDR, 'base64').toString('hex'),
                });
                if (!pushResponse.success) {
                    throw new Error('Failed to submit transaction to the network');
                }

                return { status: 'success' };
            }
            default:
                throw new Error(`Unsupported method: ${context.request.method}`);
        }
    },
});
