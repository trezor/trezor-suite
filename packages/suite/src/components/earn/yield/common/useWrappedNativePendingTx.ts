import { useEffect, useState } from 'react';

import {
    type WrappedNativeFlowType,
    fetchAndUpdateAccountThunk,
    selectAccountTransactions,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getNativeWrapTxKind, isPending } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const MIN_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;

export type WrappedNativePendingTxStatus = 'pending' | 'confirmed' | 'failed';

type TrackedWrappedNativeTransaction = {
    transaction: WalletAccountTransaction;
    isReplacement: boolean;
};

export const findTrackedWrappedNativeTransaction = ({
    transactions,
    txid,
    nonce,
}: {
    transactions: WalletAccountTransaction[];
    txid: string;
    nonce?: number;
}): TrackedWrappedNativeTransaction | undefined => {
    const originalTransaction = transactions.find(transaction => transaction.txid === txid);

    if (originalTransaction) {
        return { transaction: originalTransaction, isReplacement: false };
    }

    if (nonce === undefined) {
        return undefined;
    }

    const replacementTransaction = transactions.find(
        transaction => transaction.ethereumSpecific?.nonce === nonce,
    );

    return replacementTransaction
        ? { transaction: replacementTransaction, isReplacement: true }
        : undefined;
};

export const getWrappedNativePendingTxStatus = ({
    txid,
    trackedTransaction,
    flowType,
}: {
    txid: string | null;
    trackedTransaction?: TrackedWrappedNativeTransaction;
    flowType: WrappedNativeFlowType;
}): WrappedNativePendingTxStatus | null => {
    if (!txid) {
        return null;
    }

    if (!trackedTransaction || isPending(trackedTransaction.transaction)) {
        return 'pending';
    }

    if (
        trackedTransaction.transaction.type === 'failed' ||
        (trackedTransaction.isReplacement &&
            getNativeWrapTxKind(trackedTransaction.transaction) !== flowType)
    ) {
        return 'failed';
    }

    return 'confirmed';
};

export const useWrappedNativePendingTx = (
    account: Account,
    txid: string | null,
    flowType: WrappedNativeFlowType,
): WrappedNativePendingTxStatus | null => {
    const dispatch = useDispatch();
    const transactions = useSelector(state => selectAccountTransactions(state, account.key));
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));
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

    const status = getWrappedNativePendingTxStatus({ txid, trackedTransaction, flowType });

    useEffect(() => {
        if (status !== 'pending') {
            return undefined;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [status, account.key, dispatch, pollIntervalMs]);

    return status;
};
