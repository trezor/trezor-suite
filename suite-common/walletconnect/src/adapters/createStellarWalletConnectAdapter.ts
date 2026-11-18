import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import { type CallConnectPopupDep } from '@suite-common/connect-popup';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type CallMethodResponse } from '@trezor/connect';
import { type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';
import { type Getter } from '@trezor/dependency-injection';
import loadStellar from '@trezor/network-stellar/runtime';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
    type WalletConnectRequestParams,
    type WalletConnectSession,
} from '../walletConnectTypes';

const methods = ['stellar_signXDR', 'stellar_signAndSubmitXDR'];

const resolveStellarRequestContext = (event: WalletKitTypes.SessionRequest) => {
    const { chainId } = event.params;
    const network = networksCollection.find(
        nc => nc.networkType === 'stellar' && nc.caipId === chainId,
    );

    if (!network) {
        throw new Error(`Unsupported Stellar chain: ${chainId}`);
    }

    return {
        symbol: network.symbol,
        testnet: network.testnet,
    };
};

export type StellarWalletConnectAdapterDeps = CallConnectPopupDep &
    GetTrezorConnectDep<'pushTransaction'> & {
        getAccounts: Getter<[], Account[]>;
        getSelectedDevice: Getter<[], TrezorDevice | undefined>;
    };

type SignStellarXDRParams = {
    session: WalletConnectSession;
    xdrBase64: string;
    origin: string;
    event: WalletKitTypes.SessionRequest;
};

const signStellarXDR = async (
    deps: StellarWalletConnectAdapterDeps,
    { session, xdrBase64, origin, event }: SignStellarXDRParams,
) => {
    const { testnet } = resolveStellarRequestContext(event);

    const { parseTransactionFromXDR } = await loadStellar();

    const transaction = parseTransactionFromXDR(xdrBase64, testnet);

    const device = deps.getSelectedDevice();
    const accounts = deps.getAccounts();
    const account = accounts.find(
        a => a.networkType === 'stellar' && a.visible && a.descriptor === transaction.source,
    );
    if (!account) {
        throw new Error('Account not found');
    }

    const response = await deps.callConnectPopup({
        method: 'stellarSignTransaction',
        payload: {
            xdrBase64,
            testnet,
            path: account.path,
            device,
        },
        source: {
            type: 'walletconnect' as const,
            origin,
            manifest: {
                appName: session.peer.metadata.name,
                appIcon: session.peer.metadata.icons?.[0],
            },
        },
    });
    if (!response.success) {
        console.error('stellar_signXDR error', response);
        throw new Error('Stellar signing error');
    }
    const typedPayload = response.payload as CallMethodResponse<'stellarSignTransaction'>;

    const signature = Buffer.from(typedPayload.signature, 'hex').toString('base64');
    transaction.addSignature(account.descriptor, signature);

    return {
        signedXDR: transaction.toEnvelope().toXdr('base64'),
    };
};

const handleStellarRequest = async (
    deps: StellarWalletConnectAdapterDeps,
    { event, session }: WalletConnectRequestParams,
) => {
    // See https://docs.reown.com/advanced/multichain/rpc-reference/stellar-rpc
    switch (event.params.request.method) {
        case 'stellar_signXDR': {
            const { xdr } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const result = await signStellarXDR(deps, { session, xdrBase64: xdr, origin, event });

            return { signedXDR: result.signedXDR };
        }
        case 'stellar_signAndSubmitXDR': {
            const { xdr } = event.params.request.params;
            const { origin } = event.verifyContext.verified;
            const context = resolveStellarRequestContext(event);

            const result = await signStellarXDR(deps, { session, xdrBase64: xdr, origin, event });

            const pushResponse = await deps.getTrezorConnect().pushTransaction({
                coin: asCoinSymbol(context.symbol),
                tx: Buffer.from(result.signedXDR, 'base64').toString('hex'),
            });
            if (!pushResponse.success) {
                throw new Error('Failed to submit transaction to the network');
            }

            return { status: 'success' };
        }
    }
};

export const getChainId = (network: Network) => (network.caipId ? [network.caipId] : []);

export const getNamespace = (accounts: Account[]): Record<string, WalletConnectNamespace> => {
    const stellar = {
        chains: [],
        accounts: [],
        methods,
        events: ['accountsChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { networkType } = network;

        if (!account.visible || networkType !== 'stellar') return;

        const walletConnectChainIds = getChainId(network);
        for (const walletConnectChainId of walletConnectChainIds) {
            if (!stellar.chains.includes(walletConnectChainId)) {
                stellar.chains.push(walletConnectChainId);
            }
            stellar.accounts.push(`${walletConnectChainId}:${account.descriptor}`);
        }
    });

    if (stellar.chains.length === 0) {
        return {};
    }

    return { stellar };
};

const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    Object.entries(namespaces).forEach(
        ([key, namespace]: [string, ProposalTypes.RequiredNamespace]) => {
            if (key === 'stellar') {
                namespace.chains?.forEach(chain => {
                    const alreadyAdded = networks.some(network => network.namespaceId === chain);
                    if (alreadyAdded) return;
                    const supported = networksCollection.find(nc => chain === nc.caipId);
                    const getStatus = () => {
                        if (!supported) return 'unsupported';
                        const hasAccounts = accounts.some(
                            account => account.symbol === supported?.symbol,
                        );
                        if (hasAccounts) return 'active';

                        return 'inactive';
                    };
                    networks.push({
                        namespaceId: chain,
                        symbol: supported?.symbol,
                        name: supported?.name ?? `Unknown (${chain})`,
                        status: getStatus(),
                        required,
                    });
                });
            }
        },
    );

export const createStellarWalletConnectAdapter = (
    deps: StellarWalletConnectAdapterDeps,
): WalletConnectAdapter => ({
    methods,
    networkType: 'stellar',
    namespaceId: 'stellar',
    handleRequest: params => handleStellarRequest(deps, params),
    getNamespace,
    processNamespaces,
});
