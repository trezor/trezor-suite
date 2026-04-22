import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type CallMethodResponse } from '@trezor/connect';
import type { TronContractInput } from '@trezor/connect-common';
import { type Result } from '@trezor/type-utils';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import type {
    PendingConnectionProposalNetwork,
    WalletConnectAdapter,
    WalletConnectNamespace,
} from '../walletConnectTypes';

type TronRawData = {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
    contract: TronContractInput[];
};

// Some dApps wrap the transaction in a `transaction` field (legacy format).
type TronTransaction =
    | { raw_data: TronRawData; transaction?: undefined }
    | { transaction: { raw_data: TronRawData }; raw_data?: undefined };

const methods = ['tron_signTransaction', 'tron_signMessage'];

export const getChainId = (network: Network): string[] => (network.caipId ? [network.caipId] : []);

export const getNamespace = (accounts: Account[]): Record<string, WalletConnectNamespace> => {
    const tron = {
        chains: [],
        accounts: [],
        methods,
        events: ['accountsChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { networkType } = network;

        if (!account.visible || networkType !== 'tron') return;

        const walletConnectChainIds = getChainId(network);
        for (const walletConnectChainId of walletConnectChainIds) {
            if (!tron.chains.includes(walletConnectChainId)) {
                tron.chains.push(walletConnectChainId);
            }
            tron.accounts.push(`${walletConnectChainId}:${account.descriptor}`);
        }
    });

    if (tron.chains.length === 0) {
        return {};
    }

    return { tron };
};

const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    Object.entries(namespaces).forEach(
        ([key, namespace]: [string, ProposalTypes.RequiredNamespace]) => {
            if (key === 'tron') {
                namespace.chains?.forEach(chain => {
                    const supported = networksCollection
                        .filter(nc => nc.networkType === 'tron')
                        .find(nc => getChainId(nc).includes(chain));
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

const tronRequestThunk = createThunk<
    Record<string, unknown> | undefined,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/tronRequest`, async ({ event }, { dispatch, getState }) => {
    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('WalletConnect Session not found');
    }

    switch (event.params.request.method) {
        case 'tron_signTransaction': {
            const { address, transaction } = event.params.request.params as {
                address: string;
                transaction: TronTransaction;
            };

            // Unwrap legacy format where the actual transaction is nested.
            const rawTransaction =
                'transaction' in transaction && transaction.transaction
                    ? transaction.transaction
                    : transaction;

            const { raw_data: rawData } = rawTransaction;

            const accounts = selectAccounts(getState());
            const account = accounts.find(
                a => a.networkType === 'tron' && a.visible && a.descriptor === address,
            );
            if (!account) {
                throw new Error(`Tron account not found: ${address}`);
            }

            const device = selectSelectedDevice(getState());
            const { origin } = event.verifyContext.verified;

            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    method: 'tronSignTransaction',
                    payload: {
                        path: account.path,
                        device,
                        ref_block_bytes: rawData.ref_block_bytes,
                        ref_block_hash: rawData.ref_block_hash,
                        expiration: rawData.expiration,
                        timestamp: rawData.timestamp,
                        fee_limit: rawData.fee_limit,
                        contract: rawData.contract,
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
                .promise) as Result<CallMethodResponse<'tronSignTransaction'>>;

            if (!response.success || !response.payload.signature) {
                console.error('tron_signTransaction error', response);
                throw new Error('Tron signing error');
            }

            return { ...rawTransaction, signature: [response.payload.signature] };
        }
        case 'tron_signMessage': {
            throw new Error('Tron message signing is not supported');
        }
    }
});

export const tronAdapter = {
    methods,
    networkType: 'tron',
    namespaceId: 'tron',
    requestThunk: tronRequestThunk,
    getChainId,
    getNamespace,
    processNamespaces,
} satisfies WalletConnectAdapter;
