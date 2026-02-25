import { WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';
import bs58 from 'bs58';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect, { CallMethodResponse } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import {
    PendingConnectionProposalNetwork,
    WalletConnectAdapter,
    WalletConnectNamespace,
    WalletConnectSession,
} from '../walletConnectTypes';

const methods = [
    'solana_getAccounts',
    'solana_requestAccounts',
    'solana_signTransaction',
    'solana_signAndSendTransaction',
    'solana_signMessage',
];

const solanaSignTransaction = createThunk<
    { signature: string; transaction: string },
    {
        session: WalletConnectSession;
        transaction: string;
        feePayer?: string;
        origin: string;
        isDevnet: boolean;
    }
>(
    `${WALLETCONNECT_MODULE}/solanaSignTransaction`,
    async ({ session, transaction, feePayer, origin, isDevnet }, { dispatch, getState }) => {
        // Convert from base64 to hex
        const transactionBuffer = Buffer.from(transaction, 'base64');
        const serializedTx = transactionBuffer.toString('hex');

        const device = selectSelectedDevice(getState());
        const accounts = selectAccounts(getState());
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: isDevnet ? 'dsol' : 'sol',
            request: {
                specific: {
                    data: serializedTx,
                },
            },
        });
        if (!estimatedFee.success) {
            throw new Error('Failed to estimate fee. ' + estimatedFee.error.message);
        }
        // Get from argument or use decoded from estimate fee
        feePayer = feePayer || estimatedFee.payload.levels[0].feePayer;
        const account = accounts.find(
            a => a.networkType === 'solana' && a.visible && a.descriptor === feePayer,
        );
        if (!account) {
            throw new Error('Account not found');
        }

        dispatch(
            trezorConnectPopupActions.connectPopupCallThunk({
                method: 'solanaSignTransaction',
                payload: {
                    path: account.path,
                    device,
                    serializedTx,
                    serialize: true,
                    additionalInfo: {
                        isDevnet,
                    },
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
            .promise) as Result<CallMethodResponse<'solanaSignTransaction'>>;
        if (!response.success || !response.payload.serializedTx) {
            console.error('solana_signTransaction error', response);
            throw new Error('Solana signing error');
        }

        return {
            signature: response.payload.signature,
            transaction: response.payload.serializedTx,
        };
    },
);

const solanaRequestThunk = createThunk<
    { pubkey: string }[] | { signature: string } | undefined,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/solanaRequest`, async ({ event }, { dispatch, getState }) => {
    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('WalletConnect Session not found');
    }
    const isDevnet = session.lastAccount?.symbol === 'dsol';

    switch (event.params.request.method) {
        case 'solana_getAccounts':
        case 'solana_requestAccounts': {
            const accounts = selectAccounts(getState());

            return accounts
                .filter(a => a.networkType === 'solana' && a.visible)
                .map(a => ({ pubkey: a.descriptor }));
        }
        case 'solana_signTransaction': {
            const { transaction, feePayer } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const response = await dispatch(
                solanaSignTransaction({ session, transaction, feePayer, origin, isDevnet }),
            ).unwrap();

            const signature = bs58.encode(Buffer.from(response.signature, 'hex'));

            return { signature };
        }
        case 'solana_signAndSendTransaction': {
            const { transaction } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const signResponse = await dispatch(
                solanaSignTransaction({ session, transaction, origin, isDevnet }),
            ).unwrap();

            const pushResponse = await TrezorConnect.pushTransaction({
                coin: isDevnet ? 'dsol' : 'sol',
                tx: signResponse.transaction,
            });
            if (!pushResponse.success) {
                console.error('eth_sendTransaction push error', pushResponse);
                throw new Error('Solana transaction push error');
            }

            return { signature: pushResponse.payload.txid };
        }
        case 'solana_signMessage': {
            // Signing arbitrary messages for Solana is not supported in FW
            // We indicate support for it in the adapter for compatibility, since some apps request it but don't actually use it
            throw new Error('Solana message signing is not supported');
        }
    }
});

// https://github.com/reown-com/blockchain-api/blob/master/SUPPORTED_CHAINS.md#solana
enum SolanaChainIds {
    MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    TESTNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    MAINNET_LEGACY = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
}

export const getChainId = (network: Network) =>
    network.testnet
        ? [SolanaChainIds.TESTNET]
        : [SolanaChainIds.MAINNET, SolanaChainIds.MAINNET_LEGACY];

export const getNamespace = (accounts: Account[]): Record<string, WalletConnectNamespace> => {
    const solana = {
        chains: [],
        accounts: [],
        methods,
        events: ['accountsChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { networkType } = network;

        if (!account.visible || networkType !== 'solana') return;

        const walletConnectChainIds = getChainId(network);
        for (const walletConnectChainId of walletConnectChainIds) {
            if (!solana.chains.includes(walletConnectChainId)) {
                solana.chains.push(walletConnectChainId);
            }
            solana.accounts.push(`${walletConnectChainId}:${account.descriptor}`);
        }
    });

    if (solana.chains.length === 0) {
        return {};
    }

    return { solana };
};

const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    Object.entries(namespaces).forEach(
        ([key, namespace]: [string, ProposalTypes.RequiredNamespace]) => {
            if (key === 'solana') {
                namespace.chains?.forEach(chain => {
                    const supported = networksCollection
                        .filter(nc => nc.networkType === 'solana')
                        .find(nc => getChainId(nc).includes(chain as SolanaChainIds));
                    const alreadyAdded = networks.some(
                        network => network.symbol === supported?.symbol,
                    );
                    if (alreadyAdded) return;
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

export const solanaAdapter = {
    methods,
    networkType: 'solana',
    requestThunk: solanaRequestThunk,
    getChainId,
    getNamespace,
    processNamespaces,
} satisfies WalletConnectAdapter;
