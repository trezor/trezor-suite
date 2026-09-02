import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type TronFlow,
    fetchAndUpdateAccountThunk,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
    selectTronStakeSession,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const MIN_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_RATIO = 2;

const getPollIntervalMs = (blockTime: number | undefined): number => {
    if (!blockTime) return DEFAULT_POLL_INTERVAL_MS;

    return Math.max((blockTime / BLOCK_TIME_TO_POLL_RATIO) * 1000, MIN_POLL_INTERVAL_MS);
};

interface UseTronStakePendingTransactionTrackingProps {
    account: Account;
    flow: TronFlow;
}

export const useTronStakePendingTransactionTracking = ({
    account,
    flow,
}: UseTronStakePendingTransactionTrackingProps) => {
    const dispatch = useDispatch();
    const { pendingTxid } = useSelector(state => selectTronStakeSession(state, account.key, flow));
    const trackedTransaction = useSelector(state =>
        pendingTxid ? selectTransactionByAccountKeyAndTxid(state, account.key, pendingTxid) : null,
    );
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const isCurrentlyPending =
        !!pendingTxid && (!trackedTransaction || isPending(trackedTransaction));

    useEffect(() => {
        if (!isCurrentlyPending) {
            return;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [account.key, dispatch, isCurrentlyPending, pollIntervalMs]);

    useEffect(() => {
        if (!pendingTxid || !trackedTransaction || isPending(trackedTransaction)) {
            return;
        }

        if (trackedTransaction.type === 'failed') {
            dispatch(tronStakeActions.pendingTransactionFailed({ accountKey: account.key, flow }));
        } else {
            dispatch(
                tronStakeActions.pendingTransactionConfirmed({ accountKey: account.key, flow }),
            );
        }
    }, [account.key, flow, pendingTxid, trackedTransaction, dispatch]);
};
