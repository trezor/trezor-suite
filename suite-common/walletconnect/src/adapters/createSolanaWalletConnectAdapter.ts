import { base58 } from '@scure/base';
import type { ProposalTypes } from '@walletconnect/types';

import { type CallConnectPopupDep } from '@suite-common/connect-popup';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type CallMethodResponse } from '@trezor/connect';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import { type Getter } from '@trezor/dependency-injection';
import { type Result } from '@trezor/type-utils';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
    type WalletConnectRequestParams,
    type WalletConnectSession,
} from '../walletConnectTypes';

const methods = [
    'solana_getAccounts',
    'solana_requestAccounts',
    'solana_signTransaction',
    'solana_signAndSendTransaction',
    'solana_signMessage',
];

export type SolanaWalletConnectAdapterDeps = CallConnectPopupDep &
    GetTrezorConnectDep<'blockchainEstimateFee' | 'pushTransaction'> & {
        getAccounts: Getter<[], Account[]>;
        getSelectedDevice: Getter<[], TrezorDevice | undefined>;
    };

type SignSolanaTransactionParams = {
    session: WalletConnectSession;
    transaction: string;
    feePayer?: string;
    origin: string;
    isDevnet: boolean;
};

const signSolanaTransaction = async (
    deps: SolanaWalletConnectAdapterDeps,
    { session, transaction, feePayer, origin, isDevnet }: SignSolanaTransactionParams,
) => {
    // Convert from base64 to hex
    const transactionBuffer = Buffer.from(transaction, 'base64');
    const serializedTx = transactionBuffer.toString('hex');

    const device = deps.getSelectedDevice();
    const accounts = deps.getAccounts();
    const estimatedFee = await deps.getTrezorConnect().blockchainEstimateFee({
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
    const { levels } = estimatedFee.payload;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstLevel: (typeof levels)[number] = levels[0];
    feePayer = feePayer || firstLevel.feePayer;
    const account = accounts.find(
        a => a.networkType === 'solana' && a.visible && a.descriptor === feePayer,
    );
    if (!account) {
        throw new Error('Account not found');
    }

    const response = (await deps.callConnectPopup({
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
    })) as Result<CallMethodResponse<'solanaSignTransaction'>>;
    if (!response.success || !response.payload.serializedTx) {
        console.error('solana_signTransaction error', response);
        throw new Error('Solana signing error');
    }

    return {
        signature: response.payload.signature,
        transaction: response.payload.serializedTx,
    };
};

const handleSolanaRequest = async (
    deps: SolanaWalletConnectAdapterDeps,
    { event, session }: WalletConnectRequestParams,
) => {
    const isDevnet = session.lastAccount?.symbol === 'dsol';

    switch (event.params.request.method) {
        case 'solana_getAccounts':
        case 'solana_requestAccounts': {
            const accounts = deps.getAccounts();

            return accounts
                .filter(a => a.networkType === 'solana' && a.visible)
                .map(a => ({ pubkey: a.descriptor }));
        }
        case 'solana_signTransaction': {
            const { transaction, feePayer } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const response = await signSolanaTransaction(deps, {
                session,
                transaction,
                feePayer,
                origin,
                isDevnet,
            });

            const signature = base58.encode(Buffer.from(response.signature, 'hex'));

            return { signature };
        }
        case 'solana_signAndSendTransaction': {
            const { transaction } = event.params.request.params;
            const { origin } = event.verifyContext.verified;

            const signResponse = await signSolanaTransaction(deps, {
                session,
                transaction,
                origin,
                isDevnet,
            });

            const pushResponse = await deps.getTrezorConnect().pushTransaction({
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
};

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

export const createSolanaWalletConnectAdapter = (
    deps: SolanaWalletConnectAdapterDeps,
): WalletConnectAdapter => ({
    methods,
    networkType: 'solana',
    namespaceId: 'solana',
    handleRequest: params => handleSolanaRequest(deps, params),
    getNamespace,
    processNamespaces,
});
