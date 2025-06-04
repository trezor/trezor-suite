import { WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { createThunk } from '@suite-common/redux-utils';
import { Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getEthereumEstimateFeeParams } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import {
    PendingConnectionProposalNetwork,
    WalletConnectAdapter,
    WalletConnectNamespace,
} from '../walletConnectTypes';

const methods = [
    'eth_sendTransaction',
    'eth_signTypedData_v4',
    'personal_sign',
    'wallet_switchEthereumChain',
];

const ethereumRequestThunk = createThunk<
    string | undefined,
    {
        event: WalletKitTypes.SessionRequest;
    }
>(`${WALLETCONNECT_MODULE}/ethereumRequest`, async ({ event }, { dispatch, getState }) => {
    const device = selectSelectedDevice(getState());
    const getAccount = (address: string, chainId?: number) => {
        const account = selectAccounts(getState()).find(
            a =>
                a.descriptor.toLowerCase() === address.toLowerCase() &&
                a.networkType === 'ethereum' &&
                (!chainId || getNetwork(a.symbol).chainId === chainId),
        );
        if (!account) {
            throw new Error('Account not found');
        }

        return account;
    };
    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('Session not found');
    }
    const popupCallCommonParams = {
        source: {
            type: 'walletconnect' as const,
            origin: event.verifyContext.verified.origin,
            manifest: {
                appName: session.peer.metadata.name,
                appIcon: session.peer.metadata.icons[0],
            },
        },
    };

    switch (event.params.request.method) {
        case 'personal_sign': {
            const [message, address] = event.params.request.params;
            const account = getAccount(address);
            const messageDecoded = message.startsWith('0x')
                ? Buffer.from(message.slice(2), 'hex').toString('utf8')
                : message;
            const response = await dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignMessage',
                    payload: {
                        path: account.path,
                        message: messageDecoded,
                    },
                }),
            ).unwrap();
            if (!response.success) {
                console.error('personal_sign error', response);
                throw new Error('personal_sign error');
            }

            return response.payload.signature;
        }
        case 'eth_signTypedData_v4': {
            const [address, data] = event.params.request.params;
            const account = getAccount(address);
            const response = await dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignTypedData',
                    payload: {
                        path: account.path,
                        data: JSON.parse(data),
                        metamask_v4_compat: true,
                    },
                }),
            ).unwrap();
            if (!response.success) {
                console.error('eth_signTypedData_v4 error', response);
                throw new Error('eth_signTypedData_v4 error');
            }

            return response.payload.signature;
        }
        case 'eth_sendTransaction': {
            const chainId = Number(event.params.chainId.replace('eip155:', ''));
            const transaction = event.params.request.params[0];
            const account = getAccount(transaction.from, chainId);
            if (account.networkType !== 'ethereum') {
                throw new Error('Account is not Ethereum');
            }
            if (!transaction.gasPrice && !transaction.maxFeePerGas) {
                // Fee not provided, estimate it
                const feeLevels = await TrezorConnect.blockchainEstimateFee({
                    coin: account.symbol,
                    identity: getAccountIdentity(account),
                    request: {
                        blocks: [2],
                        specific: {
                            from: account.descriptor,
                        },
                    },
                });
                if (!feeLevels.success) {
                    throw new Error('eth_sendTransaction cannot estimate fee');
                }
                transaction.gasPrice = feeLevels.payload.levels[0]?.feePerUnit;
            }
            if (!transaction.gas) {
                const estimatedFee = await TrezorConnect.blockchainEstimateFee({
                    coin: account.symbol,
                    identity: getAccountIdentity(account),
                    request: {
                        blocks: [2],
                        specific: {
                            from: account.descriptor,
                            ...getEthereumEstimateFeeParams(
                                account.descriptor,
                                transaction.amount || account.formattedBalance,
                                undefined,
                                transaction.data,
                            ),
                        },
                    },
                });
                if (!estimatedFee.success) {
                    throw new Error('eth_sendTransaction cannot estimate fee');
                }
                transaction.gas = estimatedFee.payload.levels[0].feeLimit;
            }
            if (!transaction.value) {
                transaction.value = '0x0';
            }
            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account }),
            ).unwrap();
            const nonceHex = `0x${parseInt(nonce).toString(16)}`;
            const payload = {
                path: account.path,
                transaction: {
                    ...transaction,
                    gasLimit: transaction.gas,
                    nonce: nonceHex,
                    chainId,
                },
                device,
                useEmptyPassphrase: device?.useEmptyPassphrase,
            };
            const signResponse = await dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignTransaction',
                    payload,
                }),
            ).unwrap();
            if (!signResponse.success) {
                console.error('eth_sendTransaction error', signResponse);
                throw new Error('eth_sendTransaction error');
            }

            const pushResponse = await TrezorConnect.pushTransaction({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                tx: signResponse.payload.serializedTx,
            });
            if (!pushResponse.success) {
                console.error('eth_sendTransaction push error', pushResponse);
                throw new Error('eth_sendTransaction push error');
            }

            return pushResponse.payload.txid;
        }
        case 'wallet_switchEthereumChain': {
            // Dummy method, since Suite has no concept of switching chains
            const [chainId] = event.params.request.params;

            return chainId;
        }
    }
});

export const getChainId = (network: Network) => [`eip155:${network.chainId}`];

export const getNamespace = (accounts: Account[]) => {
    const eip155 = {
        chains: [],
        accounts: [],
        methods,
        events: ['chainChanged', 'accountsChanged'],
    } as WalletConnectNamespace;

    accounts.forEach(account => {
        const network = getNetwork(account.symbol);
        const { networkType } = network;

        if (!account.visible || networkType !== 'ethereum') return;

        const walletConnectChainIds = getChainId(network);
        for (const walletConnectChainId of walletConnectChainIds) {
            if (!eip155.chains.includes(walletConnectChainId)) {
                eip155.chains.push(walletConnectChainId);
            }
            const accountId = `${walletConnectChainId}:${account.descriptor}`;
            if (!eip155.accounts.includes(accountId)) {
                eip155.accounts.push(accountId);
            }
        }
    });

    return { eip155 };
};

const processNamespaces = (
    accounts: Account[],
    networks: PendingConnectionProposalNetwork[],
    namespaces: ProposalTypes.RequiredNamespaces,
    required: boolean,
) =>
    Object.entries(namespaces).forEach(
        ([key, namespace]: [string, ProposalTypes.RequiredNamespace]) => {
            if (key === 'eip155') {
                namespace.chains?.forEach(chain => {
                    const alreadyAdded = networks.some(network => network.namespaceId === chain);
                    if (alreadyAdded) return;
                    const supported = networksCollection.find(
                        nc => chain === `eip155:${nc.chainId}`,
                    );
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

export const ethereumAdapter = {
    methods,
    networkType: 'ethereum',
    requestThunk: ethereumRequestThunk,
    getNamespace,
    getChainId,
    processNamespaces,
} satisfies WalletConnectAdapter;
