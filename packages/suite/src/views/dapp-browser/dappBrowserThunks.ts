import {
    RPC_ERROR,
    personalSignParamsSchema,
    sendTransactionParamsSchema,
    signTypedDataParamsSchema,
} from '@suite/dapp-browser';
import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { ethereumGetCurrentNonceThunk, selectAccounts } from '@suite-common/wallet-core';
import { getAccountIdentity, sanitizeHex } from '@suite-common/wallet-utils';
import TrezorConnect, {
    type CallMethodResponse,
    type EthereumSignTypedData,
    type EthereumSignTypedDataTypes,
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
} from '@trezor/connect';
import { isAscii, isHex } from '@trezor/utils';

const ACTION_PREFIX = '@suite/dapp-browser';

export type DappRequestResult = { result: unknown } | { error: { code: number; message: string } };

type DappRequestThunkParams = {
    method: string;
    params?: unknown;
    address: string;
    chainId: number;
    origin: string;
    appName: string;
};

/**
 * Handles a `device`-lane dApp request relayed from the host (§7). Reuses the
 * exact vetted WalletConnect device path — `connectPopupCallThunk` →
 * `TrezorConnect.ethereumSign*` → on-device confirmation — so signing always
 * happens on the device (Invariant 0). M4 implements `eth_sendTransaction`;
 * `personal_sign` and `eth_signTypedData_v4` land in M5.
 */
export const handleDappRequestThunk = createThunk<DappRequestResult, DappRequestThunkParams>(
    `${ACTION_PREFIX}/handleDappRequest`,
    async ({ method, params, address, chainId, origin, appName }, { dispatch, getState }) => {
        const account = selectAccounts(getState()).find(
            candidate =>
                candidate.descriptor.toLowerCase() === address.toLowerCase() &&
                candidate.networkType === 'ethereum' &&
                getNetwork(candidate.symbol).chainId === chainId,
        );

        if (!account) {
            return { error: { code: RPC_ERROR.UNAUTHORIZED, message: 'Account not found' } };
        }

        // Narrow to the Ethereum account variant (the `.find` predicate doesn't).
        if (account.networkType !== 'ethereum') {
            return { error: { code: RPC_ERROR.UNAUTHORIZED, message: 'Account is not Ethereum' } };
        }

        // Reuse the WalletConnect call source so the existing signing UI applies.
        const source = {
            type: 'walletconnect' as const,
            origin,
            manifest: { appName },
        };

        try {
            switch (method) {
                case 'eth_sendTransaction': {
                    const parsed = sendTransactionParamsSchema.safeParse(params);

                    if (!parsed.success) {
                        return {
                            error: {
                                code: RPC_ERROR.INVALID_PARAMS,
                                message: 'Invalid transaction params',
                            },
                        };
                    }

                    const transaction = { ...parsed.data[0] };
                    const device = selectSelectedDevice(getState());

                    // Fill the fee if the dApp didn't specify one.
                    if (
                        !transaction.gasPrice &&
                        (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas)
                    ) {
                        const feeLevels = await TrezorConnect.blockchainEstimateFee({
                            coin: account.symbol,
                            identity: getAccountIdentity(account),
                            request: { blocks: [2], specific: { from: account.descriptor } },
                        });

                        if (!feeLevels.success) {
                            return {
                                error: {
                                    code: RPC_ERROR.INTERNAL_ERROR,
                                    message: 'Cannot estimate fee',
                                },
                            };
                        }

                        const level = feeLevels.payload.levels[0];

                        if (level?.eip1559) {
                            transaction.maxFeePerGas = level.eip1559.medium?.maxFeePerGas;
                            transaction.maxPriorityFeePerGas =
                                level.eip1559.medium?.maxPriorityFeePerGas;
                        } else {
                            transaction.gasPrice = level?.feePerUnit;
                        }
                    }

                    const gasLimit = transaction.gas ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;

                    const { nonce } = await dispatch(
                        ethereumGetCurrentNonceThunk({ selectedAccount: account }),
                    ).unwrap();
                    const nonceHex = sanitizeHex(parseInt(nonce, 10).toString(16));

                    const connectTransaction = {
                        to: transaction.to ?? '',
                        value: transaction.value ?? '0x0',
                        data: sanitizeHex(transaction.data || ''),
                        gasLimit,
                        nonce: nonceHex,
                        chainId,
                        ...(transaction.gasPrice
                            ? { gasPrice: transaction.gasPrice }
                            : {
                                  maxFeePerGas: transaction.maxFeePerGas ?? '0x0',
                                  maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ?? '0x0',
                              }),
                    } satisfies EthereumTransaction | EthereumTransactionEIP1559;

                    dispatch(
                        trezorConnectPopupActions.connectPopupCallThunk({
                            source,
                            method: 'ethereumSignTransaction',
                            payload: {
                                path: account.path,
                                transaction: connectTransaction,
                                device,
                            },
                        }),
                    );
                    const signResponse =
                        await trezorConnectPopupActions.getPopupCallDeferred(true).promise;

                    if (!signResponse.success) {
                        return {
                            error: { code: RPC_ERROR.USER_REJECTED, message: 'Signing rejected' },
                        };
                    }

                    const signed =
                        signResponse.payload as CallMethodResponse<'ethereumSignTransaction'>;

                    const pushResponse = await TrezorConnect.pushTransaction({
                        tx: signed.serializedTx,
                        coin: account.symbol,
                        identity: getAccountIdentity(account),
                    });

                    if (!pushResponse.success) {
                        return {
                            error: { code: RPC_ERROR.INTERNAL_ERROR, message: 'Broadcast failed' },
                        };
                    }

                    return { result: pushResponse.payload.txid };
                }
                case 'personal_sign': {
                    const parsed = personalSignParamsSchema.safeParse(params);

                    if (!parsed.success) {
                        return {
                            error: { code: RPC_ERROR.INVALID_PARAMS, message: 'Invalid params' },
                        };
                    }

                    const [message] = parsed.data;
                    const messageDecoded = message.startsWith('0x')
                        ? Buffer.from(message.slice(2), 'hex').toString('utf8')
                        : message;
                    const messageHex = isHex(message, { prefix: 'optional', allowEmpty: false })
                        ? sanitizeHex(message)
                        : Buffer.from(message, 'utf8').toString('hex');
                    const isReadable = isAscii(messageDecoded);

                    dispatch(
                        trezorConnectPopupActions.connectPopupCallThunk({
                            source,
                            method: 'ethereumSignMessage',
                            payload: {
                                path: account.path,
                                message: isReadable ? messageDecoded : messageHex,
                                hex: !isReadable,
                            },
                        }),
                    );
                    const response =
                        await trezorConnectPopupActions.getPopupCallDeferred(true).promise;

                    if (!response.success) {
                        return {
                            error: { code: RPC_ERROR.USER_REJECTED, message: 'Signing rejected' },
                        };
                    }

                    const signed = response.payload as CallMethodResponse<'ethereumSignMessage'>;

                    return { result: sanitizeHex(signed.signature) };
                }
                case 'eth_signTypedData_v4': {
                    const parsed = signTypedDataParamsSchema.safeParse(params);

                    if (!parsed.success) {
                        return {
                            error: { code: RPC_ERROR.INVALID_PARAMS, message: 'Invalid params' },
                        };
                    }

                    const [, data] = parsed.data;
                    const typedData: unknown = typeof data === 'string' ? JSON.parse(data) : data;

                    // @trezor/connect computes EIP-712 hashes internally (incl. the
                    // T1B1 path) since Connect 10 — pass the data through for every
                    // model. Firmware that lacks typed-data support surfaces a clear
                    // error from the device, mapped below.
                    const payload: EthereumSignTypedData<EthereumSignTypedDataTypes> = {
                        path: account.path,
                        data: typedData as EthereumSignTypedData<EthereumSignTypedDataTypes>['data'],
                        metamask_v4_compat: true,
                    };

                    dispatch(
                        trezorConnectPopupActions.connectPopupCallThunk({
                            source,
                            method: 'ethereumSignTypedData',
                            payload,
                        }),
                    );
                    const response =
                        await trezorConnectPopupActions.getPopupCallDeferred(true).promise;

                    if (!response.success) {
                        return {
                            error: {
                                code: RPC_ERROR.USER_REJECTED,
                                message:
                                    'Typed-data signing was rejected or is unsupported by this Trezor firmware',
                            },
                        };
                    }

                    const signed = response.payload as CallMethodResponse<'ethereumSignTypedData'>;

                    return { result: sanitizeHex(signed.signature) };
                }
                default:
                    return {
                        error: {
                            code: RPC_ERROR.UNSUPPORTED_METHOD,
                            message: `${method} is not supported`,
                        },
                    };
            }
        } catch (error) {
            return {
                error: {
                    code: RPC_ERROR.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : 'Request failed',
                },
            };
        }
    },
);
