import { useEffect } from 'react';

import {
    fetchAndUpdateAccountThunk,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
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
        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 60 * 1000,
        MIN_PENDING_TX_POLL_INTERVAL_MS,
    );
};

type PendingTransaction = {
    txid: string;
};

type UseYieldPendingTransactionTrackingProps = {
    account: Account;
    pendingTransaction: PendingTransaction | null;
};

export const useYieldPendingTransactionTracking = ({
    account,
    pendingTransaction,
}: UseYieldPendingTransactionTrackingProps) => {
    const dispatch = useDispatch();
    const trackedPendingTransaction = useSelector(state =>
        pendingTransaction
            ? selectTransactionByAccountKeyAndTxid(state, account.key, pendingTransaction.txid)
            : null,
    );
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    // Keep polling even before the tx appears in wallet.transactions.
    const isCurrentlyPending =
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
    }, [account.key, dispatch, isCurrentlyPending, pollIntervalMs]);
};
