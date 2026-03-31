import { selectAddressDisplayType } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type TransactionDto,
    type YieldDto,
    enterYield,
    exitYield,
    parseUnsignedEvmTransactionForSigning,
    submitTransactionHash,
    verifyEnterTransactions,
    verifyExitTransactions,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { type YieldFlowType } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { transactionsActions } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction } from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

import type { YieldFlowDisplayToken, YieldFlowToken } from './types';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldRevokeModalParams,
    getYieldSpenderFromTransactions,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
} from './yieldFlowUtils';
import { YIELD_PREFIX, selectYieldSession, yieldActions } from './yieldReducer';

const YIELD_THUNK_PREFIX = `${YIELD_PREFIX}/thunk`;
const YIELD_GENERIC_ERROR = 'TR_EARN_YIELD_ERROR_GENERIC';

type YieldFlowResolvedData = {
    account: Account;
    vault: YieldDto;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
};

type EvmAccount = Extract<Account, { networkType: 'ethereum' }>;

const setYieldGenericError = ({
    dispatch,
    flowType,
    flowKey,
}: {
    dispatch: Dispatch;
    flowType: YieldFlowType;
    flowKey: string;
}) => {
    dispatch(
        yieldActions.setError({
            flowType,
            flowKey,
            error: YIELD_GENERIC_ERROR,
        }),
    );
};

const getApprovalContractAddress = ({
    flowType,
    flowData,
}: {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
}) =>
    flowType === 'supply'
        ? (flowData.token.contractAddress ?? undefined)
        : (flowData.receiptToken.contractAddress ?? undefined);

const getApprovalRequestAmount = ({
    flowType,
    amount,
    flowData,
}: {
    flowType: YieldFlowType;
    amount: string;
    flowData: YieldFlowResolvedData;
}) => {
    if (flowType === 'supply') {
        return amount;
    }

    return getWithdrawRequestAmount({
        networkSymbol: flowData.account.symbol,
        amount,
        token: flowData.token,
        receiptToken: flowData.receiptToken,
        pricePerShare: flowData.vault.state?.pricePerShareState?.price,
    });
};

const getRevokeModalAmount = ({
    flowType,
    amount,
    flowData,
}: {
    flowType: YieldFlowType;
    amount: string;
    flowData: YieldFlowResolvedData;
}) => getApprovalRequestAmount({ flowType, amount, flowData }) ?? amount;

const openYieldApproveModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    spender,
    transactionId,
    preapprovedAmount,
    txType,
}: {
    dispatch: Dispatch;
    flowKey: string;
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
    spender: string;
    transactionId?: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
}) => {
    const contractAddress = getApprovalContractAddress({ flowType, flowData });

    if (!contractAddress) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    dispatch(
        yieldActions.openApprovalModal({
            flowType,
            flowKey,
            modalState: {
                amount,
                contractAddress,
                spender,
                providerId: flowData.vault.providerId,
                preapprovedAmount,
                txType,
            },
            txHashTransactionId: transactionId ?? null,
        }),
    );

    return true;
};

const openYieldRevokeModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    approveAmount,
    lastApprovedAmount,
    transactions,
    fallbackSpender,
}: {
    dispatch: Dispatch;
    flowKey: string;
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    approveAmount: string;
    lastApprovedAmount: string;
    transactions: TransactionDto[] | null;
    fallbackSpender?: string | null;
}) => {
    const revokeModalParams = transactions ? getYieldRevokeModalParams(transactions) : null;
    const spender =
        revokeModalParams?.spender ??
        (transactions ? getYieldSpenderFromTransactions(transactions) : null) ??
        fallbackSpender;

    dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));

    if (!spender) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    return openYieldApproveModal({
        dispatch,
        flowKey,
        flowType,
        flowData,
        amount: getRevokeModalAmount({ flowType, amount: approveAmount, flowData }),
        spender,
        transactionId: revokeModalParams?.transactionId,
        preapprovedAmount: lastApprovedAmount || undefined,
        txType: revokeModalParams ? 'revoke' : 'revoke-only',
    });
};

const submitYieldOpportunity = async ({
    flowType,
    flowData,
    amount,
}: {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
}) => {
    if (flowType === 'supply') {
        const response = await enterYield({
            yieldId: flowData.vault.id,
            address: flowData.account.descriptor,
            arguments: { amount },
        });
        const verification = verifyEnterTransactions(response, {
            yieldId: flowData.vault.id,
            address: flowData.account.descriptor,
            amount,
            decimals: flowData.token.decimals,
        });

        return { response, verification };
    }

    const response = await exitYield({
        yieldId: flowData.vault.id,
        address: flowData.account.descriptor,
        arguments: { amount },
    });
    const verification = verifyExitTransactions(response, {
        yieldId: flowData.vault.id,
        address: flowData.account.descriptor,
    });

    return { response, verification };
};

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

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

const sendYieldTransaction = async ({
    account,
    transaction,
    dispatch,
    getState,
}: {
    account: Account;
    transaction: TransactionDto;
    dispatch: Dispatch;
    getState: () => AppState;
}) => {
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
        throw new Error(signingResponse.error.message);
    }

    const pushResponse = await TrezorConnect.pushTransaction({
        tx: signingResponse.payload.serializedTx,
        coin: account.symbol,
        identity: getAccountIdentity(account),
    });

    if (!pushResponse.success) {
        throw new Error(pushResponse.error.message);
    }

    const { txid } = pushResponse.payload;

    dispatch(
        transactionsActions.addTransaction({
            transactions: [
                {
                    type: 'sent',
                    txid,
                    blockTime: Math.floor(Date.now() / 1000),
                    amount: '0',
                    fee: '0',
                    targets: [],
                    tokens: [],
                    internalTransfers: [],
                    details: {
                        vin: [],
                        vout: [],
                        size: 0,
                        totalInput: '0',
                        totalOutput: '0',
                    },
                },
            ],
            account,
        }),
    );

    return { txid };
};

export const handleYieldApproveSuccessTxidThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    async (
        {
            flowType,
            flowKey,
            txid,
        }: {
            flowType: YieldFlowType;
            flowKey: string;
            txid: string;
        },
        { dispatch, getState },
    ) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));

        try {
            if (approval.submitTxHashTransactionId) {
                await submitTransactionHash(
                    { transactionId: approval.submitTxHashTransactionId },
                    { hash: txid },
                );
            }

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: approveTxType,
                        txid,
                        amount: approval.amount ?? '',
                    },
                }),
            );
            dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const handleYieldApproveCancelThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }: { flowKey: string; flowType: YieldFlowType }, { dispatch }) => {
        dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
        dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));
    },
);

export const submitYieldRevokeThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    async (
        {
            flowKey,
            flowType,
            flowData,
            amount,
        }: {
            flowKey: string;
            flowType: YieldFlowType;
            flowData: YieldFlowResolvedData;
            amount: string;
        },
        { dispatch, getState },
    ) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);

        dispatch(yieldActions.clearError({ flowType, flowKey }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: '0',
            });

            if (verification === 'failure') {
                throw new Error();
            }

            const { transactions } = response.data;
            const spender =
                getYieldRevokeModalParams(transactions)?.spender ??
                getYieldSpenderFromTransactions(transactions) ??
                approval.approvedSpender;

            dispatch(
                yieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender ?? null,
                    revokeTransactions: transactions,
                }),
            );

            openYieldRevokeModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                approveAmount: amount,
                lastApprovedAmount: approval.lastApprovedAmount,
                transactions,
                fallbackSpender: spender,
            });
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const submitYieldApproveThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitApprove`,
    async (
        {
            flowKey,
            flowType,
            flowData,
            amount,
        }: {
            flowKey: string;
            flowType: YieldFlowType;
            flowData: YieldFlowResolvedData;
            amount: string;
        },
        { dispatch },
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

        dispatch(yieldActions.startSubmittingApproval({ flowType, flowKey, amount }));

        try {
            if (flowType === 'withdraw') {
                // For withdraw, X = cancel modification (no on-chain revoke needed).
                dispatch(yieldActions.cancelModification({ flowType, flowKey }));

                return;
            }

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
            const revokeModalParams = getYieldRevokeModalParams(transactions);
            const spender = approvalModalParams?.spender ?? revokeModalParams?.spender ?? null;

            dispatch(
                yieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender,
                    revokeTransactions: transactions,
                }),
            );

            if (revokeModalParams) {
                dispatch(yieldActions.setRevokeRequired({ flowType, flowKey }));
            }

            if (!approvalModalParams) {
                dispatch(
                    yieldActions.completeApproval({
                        flowType,
                        flowKey,
                        amount,
                    }),
                );

                return;
            }

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
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(yieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);

export const submitYieldActionThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitAction`,
    async (
        {
            flowKey,
            flowType,
            flowData,
            amount,
        }: {
            flowKey: string;
            flowType: YieldFlowType;
            flowData: YieldFlowResolvedData;
            amount: string;
        },
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

        dispatch(yieldActions.startSubmittingAction({ flowType, flowKey, amount }));

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
                    yieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: approvalModalParams.spender,
                        revokeTransactions: transactions,
                    }),
                );
                dispatch(yieldActions.enterModifyMode({ flowType, flowKey }));

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
                transaction: actionTransaction,
                dispatch,
                getState,
            });

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
                yieldActions.setPendingTx({
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
            dispatch(yieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
