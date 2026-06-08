import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    type TransactionsRootState,
    type YieldFlowType,
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

type YieldPendingTrackingRootState = TransactionsRootState & AccountsRootState & FeesRootState;

type UseYieldPendingTransactionTrackingParams = {
    account: Account | null;
    flowKey: string | null;
    flowType: YieldFlowType;
    isScreenFocused?: boolean;
    onApprovalConfirmed?: () => void;
    onRevokeConfirmed?: () => void;
    pendingTransaction: YieldPendingTransactionState | undefined;
};

const getPollIntervalMs = (blockTime: number | undefined): number => {
    if (!blockTime) return DEFAULT_PENDING_TX_POLL_INTERVAL_MS;

    return Math.max(
        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
        MIN_PENDING_TX_POLL_INTERVAL_MS,
    );
};

export const useYieldPendingTransactionTracking = ({
    account,
    flowKey,
    onApprovalConfirmed,
    onRevokeConfirmed,
    flowType,
    isScreenFocused,
    pendingTransaction,
}: UseYieldPendingTransactionTrackingParams) => {
    const dispatch = useDispatch();
    const accountKey = account?.key;
    const accountSymbol = account?.symbol;
    const trackedPendingTransaction = useSelector((state: YieldPendingTrackingRootState) => {
        if (!accountKey || !pendingTransaction) {
            return null;
        }

        return selectTransactionByAccountKeyAndTxid(state, accountKey, pendingTransaction.txid);
    });
    const feeInfo = useSelector((state: FeesRootState) =>
        accountSymbol ? selectConvertedNetworkFeeInfo(state, accountSymbol) : null,
    );
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);
    const shouldPollPendingTransaction =
        !!flowKey &&
        !!pendingTransaction &&
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
        if (!flowKey || !pendingTransaction || !trackedPendingTransaction) {
            return;
        }

        if (isPending(trackedPendingTransaction)) {
            return;
        }

        const sessionParams = { flowType, flowKey };

        if (trackedPendingTransaction.type === 'failed') {
            dispatch(stablecoinYieldActions.transactionFailed(sessionParams));

            return;
        }

        if (pendingTransaction.type === 'revoke' || pendingTransaction.type === 'revoke-only') {
            dispatch(stablecoinYieldActions.revokeSuccess(sessionParams));
            dispatch(stablecoinYieldActions.invalidateAllowance(sessionParams));

            if (isScreenFocused && onRevokeConfirmed) {
                onRevokeConfirmed();
            }

            return;
        }

        if (pendingTransaction.type !== 'approve') {
            dispatch(
                stablecoinYieldActions.completeAction({
                    ...sessionParams,
                    amount: pendingTransaction.amount,
                }),
            );

            if (pendingTransaction.type === 'deposit') {
                dispatch(stablecoinYieldActions.invalidateAllowance(sessionParams));
            }

            return;
        }

        dispatch(
            stablecoinYieldActions.completeApproval({
                ...sessionParams,
                amount: pendingTransaction.amount,
            }),
        );
        dispatch(stablecoinYieldActions.invalidateAllowance(sessionParams));

        if (isScreenFocused && onApprovalConfirmed) {
            onApprovalConfirmed();
        }
    }, [
        dispatch,
        flowKey,
        flowType,
        isScreenFocused,
        onApprovalConfirmed,
        onRevokeConfirmed,
        pendingTransaction,
        trackedPendingTransaction,
    ]);
};
