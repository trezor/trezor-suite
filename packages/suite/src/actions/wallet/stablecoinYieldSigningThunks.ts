import { fromWei } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectAddressDisplayType } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type TransactionDto,
    parseUnsignedEvmTransactionForSigning,
    submitTransactionHash,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowDisplayToken,
    type YieldSessionDataAmountPayload,
    getApprovalRequestAmount,
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
    openYieldApproveModal,
    setYieldGenericError,
    stablecoinYieldActions,
    submitYieldOpportunity,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getContractAddressForNetworkSymbol,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

type EvmAccount = Extract<Account, { networkType: 'ethereum' }>;

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

type BuildYieldReviewTokenParams = {
    token: YieldFlowDisplayToken;
    symbol: NetworkSymbol;
};

type BuildYieldReviewStateParams = BuildYieldReviewTokenParams & {
    parsedTransaction: ParsedTransactionForSigning;
    amount: string;
};

type BuildYieldReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    transaction: TransactionDto;
    dispatch: Dispatch;
    getState: () => AppState;
};

const getTransactionForSigning = (
    parsedTransaction: ParsedTransactionForSigning,
): EthereumSignTransaction['transaction'] => {
    const commonTransactionFields = {
        to: parsedTransaction.to,
        value: parsedTransaction.value ?? '0x0',
        gasLimit: parsedTransaction.gasLimit,
        nonce: serializeNonce(parsedTransaction.nonce),
        data: parsedTransaction.data,
        chainId: parsedTransaction.chainId,
    };

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        return {
            ...commonTransactionFields,
            maxFeePerGas: parsedTransaction.maxFeePerGas,
            maxPriorityFeePerGas: parsedTransaction.maxPriorityFeePerGas,
        };
    }

    if (parsedTransaction.gasPrice) {
        return {
            ...commonTransactionFields,
            gasPrice: parsedTransaction.gasPrice,
            txType: parsedTransaction.type,
        };
    }

    throw new Error('Yield transaction gas parameters are missing.');
};

const toGweiAmount = (amount: bigint) => fromWei(amount.toString(), 'gwei');

const buildYieldReviewToken = ({
    token,
    symbol,
}: BuildYieldReviewTokenParams): TokenInfo | undefined => {
    if (!token.contractAddress) {
        return undefined;
    }

    return {
        standard: 'ERC20',
        contract: getContractAddressForNetworkSymbol(symbol, token.contractAddress),
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.symbol,
    };
};

const buildYieldReviewState = ({
    parsedTransaction,
    amount,
    token,
    symbol,
}: BuildYieldReviewStateParams): BuildYieldReviewStateResult => {
    const gasLimit = BigInt(parsedTransaction.gasLimit);
    const gasPriceWei = BigInt(
        parsedTransaction.maxFeePerGas ?? parsedTransaction.gasPrice ?? ('0x0' as `0x${string}`),
    );
    const feeWei = gasLimit * gasPriceWei;
    const reviewToken = buildYieldReviewToken({ token, symbol });
    const amountSubunits = convertAmountUnitsToSubunits(amount, token.decimals);
    let eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        eip1559ReviewFields = {
            maxFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxFeePerGas)),
            maxPriorityFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxPriorityFeePerGas)),
        };
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: parsedTransaction.to,
                amount,
                fiat: '',
                currency: { value: '', label: '' },
                token: reviewToken?.contract ?? null,
                dataHex: parsedTransaction.data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: parsedTransaction.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: feeWei.toString(),
        feePerByte: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        totalSpent: reviewToken ? amountSubunits : (BigInt(amountSubunits) + feeWei).toString(),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: parsedTransaction.to,
                amount: amountSubunits,
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return { formState, precomposedTransaction };
};

const sendYieldTransaction = async ({
    account,
    amount,
    token,
    transaction,
    dispatch,
    getState,
}: SendYieldTransactionParams) => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const parsedTransaction = parseUnsignedEvmTransactionForSigning(
        transaction.unsignedTransaction,
    );

    if (!parsedTransaction) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const transactionForSigning = getTransactionForSigning(parsedTransaction);
    const { formState, precomposedTransaction } = buildYieldReviewState({
        parsedTransaction,
        amount,
        token,
        symbol: account.symbol,
    });

    dispatch(
        stablecoinYieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm: formState,
            accountKey: account.key,
        }),
    );

    try {
        dispatch(preserveModal());

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: (account as EvmAccount).path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            throw new Error(signingResponse.error.message);
        }

        dispatch(
            stablecoinYieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            return;
        }

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: signingResponse.payload.serializedTx,
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        dispatch(closeModal());

        if (!pushResponse.success) {
            throw new Error(pushResponse.error.message);
        }

        return pushResponse.payload;
    } finally {
        dispatch(stablecoinYieldActions.discardTransaction());
    }
};

export const submitYieldActionThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitAction`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const requestAmount = getApprovalRequestAmount({
            flowType,
            amount,
            flowData,
        });

        if (!requestAmount) {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return;
        }

        dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: requestAmount,
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const approvalModalParams = getYieldApprovalModalParams(transactions);

            if (approvalModalParams) {
                dispatch(
                    stablecoinYieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: approvalModalParams.spender,
                        revokeTransactions: transactions,
                    }),
                );
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount: requestAmount,
                    spender: approvalModalParams.spender,
                    transactionId: approvalModalParams.transactionId,
                    txType: 'approve',
                });

                return;
            }

            const actionTransaction =
                flowType === 'supply'
                    ? getYieldSupplyTransaction(transactions)
                    : getYieldWithdrawTransaction(transactions);

            if (!actionTransaction?.id) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const result = await sendYieldTransaction({
                account: flowData.account,
                amount,
                token: flowData.token,
                transaction: actionTransaction,
                dispatch,
                getState,
            });

            if (!result) {
                return;
            }

            await submitTransactionHash(
                { transactionId: actionTransaction.id },
                { hash: result.txid },
            );

            dispatch(
                notificationsActions.addToast({
                    type: flowType === 'supply' ? 'tx-yield-supply' : 'tx-yield-withdraw',
                    formattedAmount: `${amount} ${flowData.token.symbol}`,
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            const receiptAmount =
                flowType === 'supply'
                    ? (getWithdrawRequestAmount({
                          networkSymbol: flowData.account.symbol,
                          amount,
                          token: flowData.token,
                          receiptToken: flowData.receiptToken,
                          pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                      }) ?? amount)
                    : requestAmount;

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                    },
                    receiptAmount,
                }),
            );
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
