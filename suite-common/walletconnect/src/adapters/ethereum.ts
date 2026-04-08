import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';
import JSONBig from 'json-bigint';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import { type Network, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    ethereumGetCurrentNonceThunk,
    selectAccounts,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData, sanitizeHex } from '@suite-common/wallet-utils';
import TrezorConnect, {
    type CallMethodResponse,
    type EthereumSignTypedData,
    type EthereumSignTypedHash,
} from '@trezor/connect';
import { isAscii, isHex } from '@trezor/utils';

import { WALLETCONNECT_MODULE } from '../walletConnectConstants';
import { selectSessionByTopic } from '../walletConnectReducer';
import {
    type PendingConnectionProposalNetwork,
    type WalletConnectAdapter,
    type WalletConnectNamespace,
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
    const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
    const isMevProtectionFeatureEnabled = selectIsMevProtectionFeatureEnabled(getState());

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
        throw new Error('WalletConnect Session not found');
    }
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
        case 'personal_sign': {
            const [message, address] = event.params.request.params;
            const account = getAccount(address);
            const messageDecoded = message.startsWith('0x')
                ? Buffer.from(message.slice(2), 'hex').toString('utf8')
                : message;
            const messageHex = isHex(message)
                ? sanitizeHex(message)
                : Buffer.from(message, 'utf8').toString('hex');
            const isReadable = isAscii(messageDecoded);
            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignMessage',
                    payload: {
                        path: account.path,
                        message: isReadable ? messageDecoded : messageHex,
                        hex: !isReadable,
                    },
                }),
            );
            const response = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
            if (!response.success) {
                console.error('personal_sign error', response);
                throw new Error('personal_sign error');
            }
            const typedPayload = response.payload as CallMethodResponse<'ethereumSignMessage'>;

            return sanitizeHex(typedPayload.signature);
        }
        case 'eth_signTypedData_v4': {
            const [address, data] = event.params.request.params;
            const account = getAccount(address);

            // `data` can contain large unquoted integers (e.g. from CoW Swap's uint256 max value).
            // Using standard `JSON.parse` would evaluate them into floats, losing precision
            // and resulting in overflow errors during EIP-712 decoding.
            const jsonBig = JSONBig({ storeAsString: true });
            const parsedData = jsonBig.parse(data);

            // For Trezor One (T1B1), we need to pre-compute the hashes
            // as the device cannot process the full EIP-712 JSON structure
            let payload: EthereumSignTypedData<any> | EthereumSignTypedHash<any> = {
                path: account.path,
                data: parsedData,
                metamask_v4_compat: true,
            };

            if (device?.features?.internal_model === 'T1B1') {
                // Import the hash computation function
                const { transformTypedData } = await import('@trezor/connect-plugin-ethereum');
                const transformed = transformTypedData(parsedData, true);

                // Add the pre-computed hashes for Trezor One
                payload = {
                    ...payload,
                    domain_separator_hash: transformed.domain_separator_hash,
                    message_hash: transformed.message_hash || undefined,
                };
            }

            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignTypedData',
                    payload,
                }),
            );
            const response = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
            if (!response.success) {
                console.error('eth_signTypedData_v4 error', response);
                throw new Error('eth_signTypedData_v4 error');
            }
            const typedPayload = response.payload as CallMethodResponse<'ethereumSignTypedData'>;

            return sanitizeHex(typedPayload.signature);
        }
        case 'eth_sendTransaction': {
            const chainId = Number(event.params.chainId.replace('eip155:', ''));
            const transaction = event.params.request.params[0];
            const account = getAccount(transaction.from, chainId);
            if (account.networkType !== 'ethereum') {
                throw new Error('Account is not Ethereum');
            }
            if (
                !transaction.gasPrice &&
                (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas)
            ) {
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
                if (feeLevels.payload.levels[0]?.eip1559) {
                    transaction.maxFeePerGas =
                        feeLevels.payload.levels[0]?.eip1559?.medium?.maxFeePerGas;
                    transaction.maxPriorityFeePerGas =
                        feeLevels.payload.levels[0]?.eip1559?.medium?.maxPriorityFeePerGas;
                } else {
                    transaction.gasPrice = feeLevels.payload.levels[0]?.feePerUnit;
                }
            }
            if (!transaction.gas) {
                // Placeholder, will be replaced by estimate from TX simulation response
                transaction.gas = ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;
            }
            if (!transaction.value) {
                transaction.value = '0x0';
            }
            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account }),
            ).unwrap();
            const nonceHex = sanitizeHex(parseInt(nonce).toString(16));
            const payload = {
                path: account.path,
                transaction: {
                    ...transaction,
                    data: sanitizeHex(transaction.data || ''),
                    gasLimit: transaction.gas,
                    nonce: nonceHex,
                    chainId,
                },
                device,
            };
            dispatch(
                trezorConnectPopupActions.connectPopupCallThunk({
                    ...popupCallCommonParams,
                    method: 'ethereumSignTransaction',
                    payload,
                }),
            );
            const signResponse = await trezorConnectPopupActions.getPopupCallDeferred(true).promise;
            if (!signResponse.success) {
                console.error('eth_sendTransaction error', signResponse);
                throw new Error('eth_sendTransaction error');
            }
            const typedSignPayload =
                signResponse.payload as CallMethodResponse<'ethereumSignTransaction'>;

            const txData = getMevProtectedTxData(
                account.symbol,
                typedSignPayload.serializedTx,
                isMevProtectionEnabled && isMevProtectionFeatureEnabled,
            );

            const pushResponse = await TrezorConnect.pushTransaction({
                tx: txData,
                coin: account.symbol,
                identity: getAccountIdentity(account),
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

export const getNamespace = (accounts: Account[]): Record<string, WalletConnectNamespace> => {
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

    if (eip155.chains.length === 0) {
        return {};
    }

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
    namespaceId: 'eip155',
    requestThunk: ethereumRequestThunk,
    getNamespace,
    getChainId,
    processNamespaces,
} satisfies WalletConnectAdapter;
