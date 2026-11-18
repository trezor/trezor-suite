import type { ProposalTypes } from '@walletconnect/types';

import { type CallConnectPopupDep } from '@suite-common/connect-popup';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork, networksCollection } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getUnusedChangeAddress } from '@suite-common/wallet-utils';
import { type CallMethodResponse, type ComposeOutput } from '@trezor/connect';
import { type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';
import { type Getter } from '@trezor/dependency-injection';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
    type WalletConnectRequestParams,
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

export type BitcoinWalletConnectAdapterDeps = CallConnectPopupDep &
    GetTrezorConnectDep<'blockchainEstimateFee' | 'composeTransaction' | 'pushTransaction'> & {
        getAccounts: Getter<[], Account[]>;
        getSelectedDevice: Getter<[], TrezorDevice | undefined>;
    };

const handleBitcoinRequest = async (
    deps: BitcoinWalletConnectAdapterDeps,
    { event, session }: WalletConnectRequestParams,
) => {
    const device = deps.getSelectedDevice();
    const popupCallCommonParams = {
        source: {
            type: 'walletconnect' as const,
            origin: event.verifyContext.verified.origin,
            manifest: {
                appName: session.peer.metadata.name,
                appIcon: session.peer.metadata.icons?.[0],
            },
        },
    };
    switch (event.params.request.method) {
        case 'getAccountAddresses': {
            const { account: firstAddress } = event.params.request.params;
            const accounts = deps.getAccounts();
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
            const accounts = deps.getAccounts();
            const account = findAccount(accounts, firstAddress);
            if (!account?.addresses) throw new Error('Account not found or addresses not loaded');
            const addressInfo = [
                ...account.addresses.used,
                ...account.addresses.change,
                ...account.addresses.unused,
            ].find(a => a.address === address || !address);
            if (!addressInfo) throw new Error('Address not found');
            const response = await deps.callConnectPopup({
                method: 'signMessage',
                payload: {
                    path: addressInfo.path,
                    coin: asCoinSymbol(account.symbol),
                    message,
                    hex: true,
                    device,
                },
                ...popupCallCommonParams,
            });
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
            const accounts = deps.getAccounts();
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
            const feeLevels = await deps.getTrezorConnect().blockchainEstimateFee({
                coin: asCoinSymbol(account.symbol),
                identity: getAccountIdentity(account),
                request: {
                    blocks: [1],
                },
            });
            if (!feeLevels.success) {
                console.error('blockchainEstimateFee error', feeLevels);
                throw new Error('blockchainEstimateFee error');
            }

            const precomposedTransaction = await deps.getTrezorConnect().composeTransaction({
                outputs,
                coin: asCoinSymbol(account.symbol),
                path: account.path,
                utxo: account.utxo!,
                // The account change address stays unused when the dApp passes its own
                // changeAddress, which is added as a send-max output that takes the rest.
                changeAddress: getUnusedChangeAddress(account.addresses?.change),
                feeLevels: feeLevels.payload.levels,
                device,
            });
            if (!precomposedTransaction.success) {
                console.error('composeTransaction error', precomposedTransaction);
                throw new Error('composeTransaction error');
            }
            const { payload: precomposedPayload } = precomposedTransaction;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstResult: (typeof precomposedPayload)[number] = precomposedPayload[0];
            if (firstResult.type !== 'final') {
                console.error('composeTransaction error', precomposedTransaction);
                throw new Error('composeTransaction error');
            }
            const signResponse = await deps.callConnectPopup({
                method: 'signTransaction',
                payload: {
                    inputs: firstResult.inputs,
                    outputs: firstResult.outputs,
                    account: {
                        addresses: account.addresses!,
                    },
                    coin: asCoinSymbol(account.symbol),
                    chunkify: true,
                    unlockPath: account.unlockPath,
                    version: 2,
                },
                ...popupCallCommonParams,
            });
            if (!signResponse.success) {
                console.error('signTransaction error', signResponse);
                throw new Error('signTransaction error');
            }
            const typedPayload = signResponse.payload as CallMethodResponse<'signTransaction'>;

            const pushResponse = await deps.getTrezorConnect().pushTransaction({
                coin: asCoinSymbol(account.symbol),
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
};

export const getNamespace = (accounts: Account[]): Record<string, WalletConnectNamespace> => {
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

    if (bip122.chains.length === 0) {
        return {};
    }

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

export const createBitcoinWalletConnectAdapter = (
    deps: BitcoinWalletConnectAdapterDeps,
): WalletConnectAdapter => ({
    methods,
    networkType: 'bitcoin',
    namespaceId: 'bip122',
    handleRequest: params => handleBitcoinRequest(deps, params),
    getNamespace,
    processNamespaces,
});
