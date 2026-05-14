import { type WalletKitTypes } from '@reown/walletkit';
import {
    FeeBumpTransaction,
    Networks,
    type Transaction,
    TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { ProposalTypes } from '@walletconnect/types';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { type CallMethodResponse } from '@trezor/connect';
import { transformTransaction } from '@trezor/connect-plugin-stellar';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
    type WalletConnectSession,
} from '../walletConnectTypes';

const methods = ['stellar_signXDR', 'stellar_signAndSubmitXDR'];

// Supported classic Stellar operation types in TrezorConnect.
// TODO: Perhaps we can add this to `transformTransaction`
const SUPPORTED_OPERATION_TYPES = new Set([
    'createAccount',
    'payment',
    'pathPaymentStrictReceive',
    'pathPaymentStrictSend',
    'createPassiveSellOffer',
    'manageSellOffer',
    'manageBuyOffer',
    'setOptions',
    'changeTrust',
    'allowTrust',
    'accountMerge',
    'inflation',
    'manageData',
    'bumpSequence',
    'claimClaimableBalance',
]);

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
        networkPassphrase: network.testnet ? Networks.TESTNET : Networks.PUBLIC,
    };
};

const stellarSignXDR = createThunk<
    { signedXDR: string },
    {
        session: WalletConnectSession;
        xdrBase64: string;
        origin: string;
        event: WalletKitTypes.SessionRequest;
    }
>(
    `${WALLETCONNECT_MODULE}/stellarSignXDR`,
    async ({ session, xdrBase64, origin, event }, { dispatch, getState }) => {
        const context = resolveStellarRequestContext(event);

        let parsed;
        try {
            parsed = TransactionBuilder.fromXDR(xdrBase64, context.networkPassphrase);
        } catch {
            throw new Error('Invalid XDR');
        }

        if (parsed instanceof FeeBumpTransaction) {
            throw new Error('Unsupported envelope type');
        }

        const transaction = parsed as Transaction;

        // Validate all operations are supported classic types.
        for (const op of transaction.operations) {
            if (!SUPPORTED_OPERATION_TYPES.has(op.type)) {
                throw new Error(`Unsupported operation: ${op.type}`);
            }
        }

        const device = selectSelectedDevice(getState());
        const accounts = selectAccounts(getState());
        const account = accounts.find(
            a => a.networkType === 'stellar' && a.visible && a.descriptor === transaction.source,
        );
        if (!account) {
            throw new Error('Account not found');
        }

        const transformedTransaction = transformTransaction(account.path, transaction);

        dispatch(
            trezorConnectPopupActions.connectPopupCallThunk({
                method: 'stellarSignTransaction',
                payload: {
                    ...transformedTransaction,
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
            }),
        );

        const response = (await trezorConnectPopupActions.getPopupCallDeferred(true)
            .promise) as Awaited<
            ReturnType<typeof trezorConnectPopupActions.getPopupCallDeferred>['promise']
        >;
        if (!response.success) {
            console.error('stellar_signXDR error', response);
            throw new Error('Stellar signing error');
        }
        const typedPayload = response.payload as CallMethodResponse<'stellarSignTransaction'>;

        const signature = Buffer.from(typedPayload.signature, 'hex').toString('base64');
        transaction.addSignature(account.descriptor, signature);

        return {
            signedXDR: transaction.toEnvelope().toXDR('base64'),
        };
    },
);

const stellarRequestThunk = createThunk<
    { signedXDR: string } | { status: string } | undefined,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/stellarRequest`, async ({ event }, { dispatch, getState }) => {
    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('WalletConnect Session not found');
    }

    // See https://docs.reown.com/advanced/multichain/rpc-reference/stellar-rpc
    switch (event.params.request.method) {
        case 'stellar_signXDR': {
            const { xdr } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const result = await dispatch(
                stellarSignXDR({ session, xdrBase64: xdr, origin, event }),
            ).unwrap();

            return { signedXDR: result.signedXDR };
        }
        case 'stellar_signAndSubmitXDR': {
            const { xdr } = event.params.request.params;
            const { origin } = event.verifyContext.verified;
            const context = resolveStellarRequestContext(event);

            const result = await dispatch(
                stellarSignXDR({ session, xdrBase64: xdr, origin, event }),
            ).unwrap();

            const pushResponse = await TrezorConnect.pushTransaction({
                coin: context.symbol,
                tx: Buffer.from(result.signedXDR, 'base64').toString('hex'),
            });
            if (!pushResponse.success) {
                throw new Error('Failed to submit transaction to the network');
            }

            return { status: 'success' };
        }
    }
});

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

export const stellarAdapter = {
    methods,
    networkType: 'stellar',
    namespaceId: 'stellar',
    requestThunk: stellarRequestThunk,
    getChainId,
    getNamespace,
    processNamespaces,
} satisfies WalletConnectAdapter;
