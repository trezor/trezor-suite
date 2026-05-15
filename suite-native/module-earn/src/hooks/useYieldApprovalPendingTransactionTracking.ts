import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    type TransactionsRootState,
    type YieldFlowStepId,
    type YieldPendingTransactionState,
    fetchAndUpdateAccountThunk,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

const DEFAULT_PENDING_TX_POLL_INTERVAL_MS = 3_000;
const MIN_PENDING_TX_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;

type YieldApprovalPendingTrackingRootState = TransactionsRootState &
    AccountsRootState &
    FeesRootState;

type UseYieldApprovalPendingTransactionTrackingParams = {
    account: Account | null;
    approvalPendingTransaction: YieldPendingTransactionState | undefined;
    flowKey: string | null;
    isApprovalPending: boolean;
    isScreenFocused: boolean;
    onApprovalConfirmed: () => void;
    sessionStep: YieldFlowStepId | undefined;
};

const getPollIntervalMs = (blockTime: number | undefined): number => {
    if (!blockTime) return DEFAULT_PENDING_TX_POLL_INTERVAL_MS;

    return Math.max(
        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
        MIN_PENDING_TX_POLL_INTERVAL_MS,
    );
};

export const useYieldApprovalPendingTransactionTracking = ({
    account,
    approvalPendingTransaction,
    flowKey,
    isApprovalPending,
    isScreenFocused,
    onApprovalConfirmed,
    sessionStep,
}: UseYieldApprovalPendingTransactionTrackingParams) => {
    const dispatch = useDispatch();
    const accountKey = account?.key;
    const accountSymbol = account?.symbol;
    const trackedPendingTransaction = useSelector(
        (state: YieldApprovalPendingTrackingRootState) => {
            if (!accountKey || !approvalPendingTransaction) {
                return null;
            }

            return selectTransactionByAccountKeyAndTxid(
                state,
                accountKey,
                approvalPendingTransaction.txid,
            );
        },
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        accountSymbol ? selectConvertedNetworkFeeInfo(state, accountSymbol) : null,
    );
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);
    const shouldPollPendingTransaction =
        !!flowKey &&
        !!approvalPendingTransaction &&
        (!trackedPendingTransaction || isPending(trackedPendingTransaction));

    useEffect(() => {
        if (!accountKey || !shouldPollPendingTransaction) {
            return undefined;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [accountKey, dispatch, pollIntervalMs, shouldPollPendingTransaction]);

    useEffect(() => {
        if (!flowKey || !approvalPendingTransaction || !trackedPendingTransaction) {
            return;
        }

        if (isPending(trackedPendingTransaction)) {
            return;
        }

        const sessionParams = { flowType: 'deposit' as const, flowKey };

        if (trackedPendingTransaction.type === 'failed') {
            dispatch(stablecoinYieldActions.transactionFailed(sessionParams));

            return;
        }

        if (
            approvalPendingTransaction.type === 'revoke' ||
            approvalPendingTransaction.type === 'revoke-only'
        ) {
            dispatch(stablecoinYieldActions.revokeSuccess(sessionParams));
            dispatch(stablecoinYieldActions.invalidateAllowance(sessionParams));

            return;
        }

        dispatch(
            stablecoinYieldActions.completeApproval({
                ...sessionParams,
                amount: approvalPendingTransaction.amount,
            }),
        );
        dispatch(stablecoinYieldActions.invalidateAllowance(sessionParams));
    }, [approvalPendingTransaction, dispatch, flowKey, trackedPendingTransaction]);

    useEffect(() => {
        if (!flowKey || !isScreenFocused || isApprovalPending || sessionStep !== 'action') {
            return;
        }

        onApprovalConfirmed();
    }, [flowKey, isApprovalPending, isScreenFocused, onApprovalConfirmed, sessionStep]);
};
