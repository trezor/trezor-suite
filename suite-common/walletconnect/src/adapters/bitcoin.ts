import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type Bip43Path,
    type Network,
    getNetwork,
    networksCollection,
} from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, { type CallMethodResponse, type ComposeOutput } from '@trezor/connect';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
} from '../walletConnectTypes';

const methods = [
    'sendTransfer',
    'signMessage',
    'getAccountAddresses',
    // 'signPsbt' is not supported currently
];

const findAccount = (accounts: Account[], firstAddress: string) =>
    accounts.find(account => {
        const usedAddresses = account.addresses?.used.map(a => a.address) ?? [];
        const unusedAddresses = account.addresses?.unused.map(a => a.address) ?? [];

        return usedAddresses.includes(firstAddress) || unusedAddresses.includes(firstAddress);
    });

const bitcoinRequestThunk = createThunk<
    | { address: string; publicKey: string; path: Bip43Path }[]
    | { address: string; signature: string }
    | { txid: string }
    | undefined,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/bitcoinRequest`, async ({ event }, { dispatch, getState }) => {
    const device = selectSelectedDevice(getState());
    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('WalletConnect Session not found');
    }
    const popupCallCommonParams = {
        source: {
            type: 'walletconnect' as const,
            origin: session.peer.metadata.url,
            manifest: {
                appName: session.peer.metadata.name,
                appIcon: session.peer.metadata.icons?.[0],
            },
        },
    };
    switch (event.params.request.method) {
        case 'getAccountAddresses': {
            const { account: firstAddress } = event.params.request.params;
            const accounts = selectAccounts(getState());
            const account = findAccount(accounts, firstAddress);
            if (!account?.addresses) return;

            return [
                ...account.addresses.used,
                ...account.addresses.change,
                ...account.addresses.unused,
            ].flatMap(a => ({
                address: a.address,
                publicKey: account.descriptor,
                path: account.path,
            }));
        }
        case 'signMessage': {
            const { account: firstAddress, message, address } = event.params.request.params;
            const accounts = selectAccounts(getState());
            const account = findAccount(accounts, firstAddress);
            if (!account?.addresses) throw new Error('Account not found or addresses not loaded');
            const addressInfo = [
                ...account.addresses.used,
                ...account.addresses.change,
                ...account.addresses.unused,
            ].find(a => a.address === address || !address);
            if (!addressInfo) throw new Error('Address not found');
            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    method: 'signMessage',
                    payload: {
                        path: addressInfo.path,
                        coin: account.symbol,
                        message,
                        hex: true,
                        device,
                    },
                    ...popupCallCommonParams,
                }),
            );
            const response = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
            if (!response.success) {
                console.error('signMessage error', response);
                throw new Error('signMessage error');
            }
            const typedPayload = response.payload as CallMethodResponse<'signMessage'>;

            return { signature: typedPayload.signature, address: typedPayload.address };
        }
        case 'sendTransfer': {
            const {
                account: firstAddress,
                recipientAddress,
                amount,
                changeAddress,
                memo,
            } = event.params.request.params;
            const accounts = selectAccounts(getState());
            const account = findAccount(accounts, firstAddress);
            if (!account) throw new Error('Account not found');

            const outputs: ComposeOutput[] = [
                { type: 'payment', address: recipientAddress, amount },
            ];
            if (memo) {
                outputs.push({
                    type: 'opreturn',
                    dataHex: memo,
                });
            }
            if (changeAddress) {
                outputs.push({
                    type: 'send-max',
                    address: changeAddress,
                });
            }
            const feeLevels = await TrezorConnect.blockchainEstimateFee({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                request: {
                    blocks: [1],
                },
            });
            if (!feeLevels.success) {
                console.error('blockchainEstimateFee error', feeLevels);
                throw new Error('blockchainEstimateFee error');
            }
            const precomposedTransaction = await TrezorConnect.composeTransaction({
                outputs,
                coin: account.symbol,
                identity: getAccountIdentity(account),
                account: {
                    path: account.path,
                    addresses: account.addresses!,
                    utxo: account.utxo!,
                },
                feeLevels: feeLevels.payload.levels,
                device,
            });
            if (
                !precomposedTransaction.success ||
                precomposedTransaction.payload[0].type !== 'final'
            ) {
                console.error('composeTransaction error', precomposedTransaction);
                throw new Error('composeTransaction error');
            }
            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    method: 'signTransaction',
                    payload: {
                        inputs: precomposedTransaction.payload[0].inputs,
                        outputs: precomposedTransaction.payload[0].outputs,
                        account: {
                            addresses: account.addresses!,
                        },
                        coin: account.symbol,
                        chunkify: true,
                        unlockPath: account.unlockPath,
                        version: 2,
                    },
                    ...popupCallCommonParams,
                }),
            );
            const signResponse = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
            if (!signResponse.success) {
                console.error('signTransaction error', signResponse);
                throw new Error('signTransaction error');
            }
            const typedPayload = signResponse.payload as CallMethodResponse<'signTransaction'>;

            const pushResponse = await TrezorConnect.pushTransaction({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                tx: typedPayload.serializedTx,
            });
            if (!pushResponse.success) {
                console.error('eth_sendTransaction push error', pushResponse);
                throw new Error('eth_sendTransaction push error');
            }

            return { txid: pushResponse.payload.txid };
        }
    }
});

export const getChainId = (network: Network) => {
    if (network.caipId) {
        return [network.caipId];
    }

    return [];
};

export const getNamespace = (accounts: Account[]) => {
    const bip122 = {
        chains: [],
        accounts: [],
        methods,
        events: ['accountsChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { networkType } = network;

        if (!account.visible || networkType !== 'bitcoin' || !account.addresses) return;

        if (network.caipId) {
            if (!bip122.chains.includes(network.caipId)) {
                bip122.chains.push(network.caipId);
            }
            const firstAddress = [...account.addresses.used, ...account.addresses.unused].find(a =>
                a.path.endsWith('/0/0'),
            )?.address;
            bip122.accounts.push(`${network.caipId}:${firstAddress}`);
        }
    });

    return { bip122 };
};
const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    Object.entries(namespaces).forEach(
        ([key, namespace]: [string, ProposalTypes.RequiredNamespace]) => {
            if (key === 'bip122') {
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

export const bitcoinAdapter = {
    methods,
    networkType: 'bitcoin',
    namespaceId: 'bip122',
    requestThunk: bitcoinRequestThunk,
    getChainId,
    getNamespace,
    processNamespaces,
} satisfies WalletConnectAdapter;
