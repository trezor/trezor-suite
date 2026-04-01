import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type CallMethodResponse } from '@trezor/connect';
import { parseTronTransaction } from '@trezor/connect/src/api/tron/tronParse';
import { type Result } from '@trezor/type-utils';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import type {
    PendingConnectionProposalNetwork,
    WalletConnectAdapter,
    WalletConnectNamespace,
} from '../walletConnectTypes';

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
                transaction: Record<string, unknown>;
            };

            const rawTransaction = (
                transaction.transaction && typeof transaction.transaction === 'object'
                    ? transaction.transaction
                    : transaction
            ) as Record<string, unknown>;

            const rawDataHex = rawTransaction.raw_data_hex as string | undefined;
            if (!rawDataHex) {
                throw new Error('Missing raw_data_hex in tron_signTransaction params');
            }

            const parsed = parseTronTransaction(rawDataHex);

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
                        ref_block_bytes: parsed.ref_block_bytes,
                        ref_block_hash: parsed.ref_block_hash,
                        expiration: parsed.expiration,
                        timestamp: parsed.timestamp,
                        fee_limit: parsed.fee_limit,
                        contract: parsed.contract,
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
