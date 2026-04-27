import { type Dispatch } from '@reduxjs/toolkit';

import {
    type TransactionDto,
    type YieldDto,
    enterYield,
    exitYield,
    submitTransactionHash,
    verifyEnterTransactions,
    verifyExitTransactions,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { STABLECOIN_YIELD_PREFIX, stablecoinYieldActions } from './stablecoinYieldReducer';
import { selectStablecoinYieldSession } from './stablecoinYieldSelectors';
import type { YieldFlowDisplayToken, YieldFlowToken, YieldFlowType } from './stablecoinYieldTypes';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldRevokeModalParams,
    getYieldSpenderFromTransactions,
    getYieldVaultAddressFromTransactions,
} from './stablecoinYieldUtils';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;
const YIELD_GENERIC_ERROR = 'TR_EARN_YIELD_ERROR_GENERIC';

export type YieldFlowResolvedData = {
    account: Account;
    vault: YieldDto;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
};

export type YieldSessionPayload = {
    flowType: YieldFlowType;
    flowKey: string;
};

export type YieldSessionDataPayload = YieldSessionPayload & {
    flowData: YieldFlowResolvedData;
};

export type YieldSessionDataAmountPayload = YieldSessionDataPayload & {
    amount: string;
};

type SetYieldGenericErrorParams = YieldSessionPayload & {
    dispatch: Dispatch;
};

type GetApprovalContractAddressParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
};

type GetApprovalRequestAmountParams = GetApprovalContractAddressParams & {
    amount: string;
};

type OpenYieldApproveModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    amount: string;
    spender: string;
    transactionId?: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
};

type OpenYieldRevokeModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    approveAmount: string;
    lastApprovedAmount: string;
    transactions: TransactionDto[] | null;
    fallbackSpender?: string | null;
};

export type SubmitYieldOpportunityParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
};

export const setYieldGenericError = ({
    dispatch,
    flowType,
    flowKey,
}: SetYieldGenericErrorParams) => {
    dispatch(
        stablecoinYieldActions.setError({
            flowType,
            flowKey,
            error: YIELD_GENERIC_ERROR,
        }),
    );
};

export const getApprovalContractAddress = ({
    flowType,
    flowData,
}: GetApprovalContractAddressParams) =>
    flowType === 'supply'
        ? (flowData.token.contractAddress ?? undefined)
        : (flowData.receiptToken.contractAddress ?? undefined);

export const getApprovalRequestAmount = ({
    flowType,
    amount,
    flowData,
}: GetApprovalRequestAmountParams) => {
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

export const getRevokeModalAmount = ({
    flowType,
    amount,
    flowData,
}: GetApprovalRequestAmountParams) =>
    getApprovalRequestAmount({ flowType, amount, flowData }) ?? amount;

export const openYieldApproveModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    spender,
    transactionId,
    preapprovedAmount,
    txType,
}: OpenYieldApproveModalParams) => {
    const contractAddress = getApprovalContractAddress({ flowType, flowData });

    if (!contractAddress) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    dispatch(
        stablecoinYieldActions.openApprovalModal({
            flowType,
            flowKey,
            modalState: {
                amount,
                contractAddress,
                spender,
                preapprovedAmount,
                txType,
            },
            txHashTransactionId: transactionId ?? null,
        }),
    );

    return true;
};

export const openYieldRevokeModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    approveAmount,
    lastApprovedAmount,
    transactions,
    fallbackSpender,
}: OpenYieldRevokeModalParams) => {
    const revokeModalParams = transactions ? getYieldRevokeModalParams(transactions) : null;
    const spender =
        revokeModalParams?.spender ??
        (transactions ? getYieldSpenderFromTransactions(transactions) : null) ??
        fallbackSpender;

    dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));

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

export const submitYieldOpportunity = async ({
    flowType,
    flowData,
    amount,
}: SubmitYieldOpportunityParams) => {
    switch (flowType) {
        case 'supply': {
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
        case 'withdraw': {
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
        }
        default:
            return exhaustive(flowType);
    }
};

export const handleYieldApproveSuccessTxidThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    async (
        { flowType, flowKey, txid }: YieldSessionPayload & { txid: string },
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));

        try {
            if (approval.submitTxHashTransactionId) {
                await submitTransactionHash(
                    { transactionId: approval.submitTxHashTransactionId },
                    { hash: txid },
                );
            }

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: approveTxType,
                        txid,
                        amount: approval.amount ?? '',
                    },
                }),
            );
            dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const handleYieldApproveCancelThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }: YieldSessionPayload, { dispatch }) => {
        dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
        dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));
    },
);

export const submitYieldRevokeThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);

        dispatch(stablecoinYieldActions.clearError({ flowType, flowKey }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: '0',
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const spender =
                getYieldRevokeModalParams(transactions)?.spender ??
                getYieldSpenderFromTransactions(transactions) ??
                approval.approvedSpender;

            dispatch(
                stablecoinYieldActions.setApprovalResponse({
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
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
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

        dispatch(stablecoinYieldActions.startSubmittingApproval({ flowType, flowKey, amount }));

        try {
            if (flowType === 'withdraw') {
                dispatch(stablecoinYieldActions.cancelModification({ flowType, flowKey }));

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
            const spender =
                approvalModalParams?.spender ??
                revokeModalParams?.spender ??
                getYieldVaultAddressFromTransactions(transactions);

            dispatch(
                stablecoinYieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender,
                    revokeTransactions: transactions,
                }),
            );

            if (revokeModalParams) {
                dispatch(stablecoinYieldActions.setRevokeRequired({ flowType, flowKey }));
            }

            if (!approvalModalParams) {
                dispatch(
                    stablecoinYieldActions.completeApproval({
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
            dispatch(stablecoinYieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);
