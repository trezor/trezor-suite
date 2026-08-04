import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import {
    type WrappedNativePendingTxStatus,
    findTrackedWrappedNativeTransaction,
    getWrappedNativePendingTxStatus,
} from '@suite-common/wallet-utils';

import { type WrappedNativeFlowType } from './stablecoinYieldTypes';
import { fetchAndUpdateAccountThunk } from '../accounts/accountsThunks';
import { type FeesRootState, selectConvertedNetworkFeeInfo } from '../fees/feesReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectAccountTransactions } from '../transactions/transactionsSelectors';

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const MIN_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;

export type { WrappedNativePendingTxStatus };

/**
 * Tracks a broadcast wrap/unwrap transaction until it confirms (or fails), polling the account
 * while pending. Follows a fee-bump replacement by its EVM nonce.
 */
export const useWrappedNativePendingTx = (
    account: Account | null,
    txid: string | null,
    flowType: WrappedNativeFlowType,
): WrappedNativePendingTxStatus | null => {
    const dispatch = useDispatch();
    const transactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, account?.key ?? null),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const [trackedNonce, setTrackedNonce] = useState<{ txid: string; nonce: number } | null>(null);
    const trackedTransaction = txid
        ? findTrackedWrappedNativeTransaction({
              transactions,
              txid,
              nonce: trackedNonce?.txid === txid ? trackedNonce.nonce : undefined,
          })
        : undefined;
    const originalNonce =
        trackedTransaction && !trackedTransaction.isReplacement
            ? trackedTransaction.transaction.ethereumSpecific?.nonce
            : undefined;

    useEffect(() => {
        if (!txid || originalNonce === undefined) {
            return;
        }

        setTrackedNonce(current =>
            current?.txid === txid && current.nonce === originalNonce
                ? current
                : { txid, nonce: originalNonce },
        );
    }, [originalNonce, txid]);

    const pollIntervalMs = feeInfo?.blockTime
        ? Math.max(
              (feeInfo.blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
              MIN_POLL_INTERVAL_MS,
          )
        : DEFAULT_POLL_INTERVAL_MS;

    const status = account
        ? getWrappedNativePendingTxStatus({ txid, trackedTransaction, flowType })
        : null;
    const accountKey = account?.key;

    useEffect(() => {
        if (status !== 'pending' || !accountKey) {
            return undefined;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [status, accountKey, dispatch, pollIntervalMs]);

    return status;
};
