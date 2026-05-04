import { useEffect } from 'react';

import {
    type YieldFlowType,
    fetchAndUpdateAccountThunk,
    selectConvertedNetworkFeeInfo,
    selectStablecoinYieldSession,
    selectTransactionByAccountKeyAndTxid,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

const DEFAULT_PENDING_TX_POLL_INTERVAL_MS = 3_000;
const MIN_PENDING_TX_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;

const getPollIntervalMs = (blockTime: number | undefined): number => {
    if (!blockTime) return DEFAULT_PENDING_TX_POLL_INTERVAL_MS;

    return Math.max(
        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
        MIN_PENDING_TX_POLL_INTERVAL_MS,
    );
};

type UseYieldPendingTransactionTrackingProps = {
    account?: Account;
    flowType: YieldFlowType;
    flowKey: string;
};

export const useYieldPendingTransactionTracking = ({
    account,
    flowType,
    flowKey,
}: UseYieldPendingTransactionTrackingProps) => {
    const dispatch = useDispatch();
    const pendingTransaction = useSelector(
        state => selectStablecoinYieldSession(state, flowType, flowKey).action.pendingTransaction,
    );
    const trackedPendingTransaction = useSelector(state =>
        account && pendingTransaction
            ? selectTransactionByAccountKeyAndTxid(state, account.key, pendingTransaction.txid)
            : null,
    );
    const feeInfo = useSelector(state =>
        account ? selectConvertedNetworkFeeInfo(state, account.symbol) : null,
    );
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const isCurrentlyPending =
        !!account &&
        !!pendingTransaction &&
        (!trackedPendingTransaction || isPending(trackedPendingTransaction));

    useEffect(() => {
        if (!isCurrentlyPending) {
            return;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [account, dispatch, isCurrentlyPending, pollIntervalMs]);

    useEffect(() => {
        if (!pendingTransaction || !trackedPendingTransaction) {
            return;
        }

        if (isPending(trackedPendingTransaction)) {
            return;
        }

        if (trackedPendingTransaction.type === 'failed') {
            dispatch(stablecoinYieldActions.transactionFailed({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === 'revoke' || pendingTransaction.type === 'revoke-only') {
            dispatch(stablecoinYieldActions.revokeSuccess({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === 'approve') {
            dispatch(
                stablecoinYieldActions.completeApproval({
                    flowType,
                    flowKey,
                    amount: pendingTransaction.amount,
                }),
            );

            return;
        }

        if (pendingTransaction.type === flowType) {
            dispatch(
                stablecoinYieldActions.completeAction({
                    flowType,
                    flowKey,
                    amount: pendingTransaction.amount,
                }),
            );

            return;
        }

        dispatch(stablecoinYieldActions.resetSession({ flowType, flowKey }));
    }, [flowKey, flowType, pendingTransaction, dispatch, trackedPendingTransaction]);
};
