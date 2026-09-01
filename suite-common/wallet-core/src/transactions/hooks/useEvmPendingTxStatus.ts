import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { type Account, type EvmTransactionPurpose } from '@suite-common/wallet-types';
import {
    type EvmPendingTxStatus,
    findTrackedEvmTransaction,
    getEvmPendingTxStatus,
    getPollIntervalMs,
} from '@suite-common/wallet-utils';

import { fetchAndUpdateAccountThunk } from '../../accounts/accountsThunks';
import { type FeesRootState, selectConvertedNetworkFeeInfo } from '../../fees/feesReducer';
import { type TransactionsRootState } from '../transactionsReducerTypes';
import { selectAccountTransactions } from '../transactionsSelectors';

export type { EvmPendingTxStatus };

interface TrackedNonce {
    txid: string;
    nonce: number;
}

export interface EvmPendingTxTracking {
    status: EvmPendingTxStatus | null;
    nonce: number | undefined;
}

export const useEvmPendingTxStatus = (
    account: Account | null,
    txid: string | null,
    expectedPurpose: EvmTransactionPurpose,
    persistedNonce?: number,
): EvmPendingTxTracking => {
    const dispatch = useDispatch();

    const transactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, account?.key ?? null),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const [trackedNonce, setTrackedNonce] = useState<TrackedNonce | null>(null);

    const knownNonce =
        (trackedNonce?.txid === txid ? trackedNonce.nonce : undefined) ?? persistedNonce;

    const trackedTransaction = txid
        ? findTrackedEvmTransaction({ transactions, txid, nonce: knownNonce })
        : undefined;

    const originalNonce =
        trackedTransaction && !trackedTransaction.isReplacement
            ? trackedTransaction.transaction.ethereumSpecific?.nonce
            : undefined;

    useEffect(() => {
        if (!txid || originalNonce === undefined) return;

        setTrackedNonce(current =>
            current?.txid === txid && current.nonce === originalNonce
                ? current
                : { txid, nonce: originalNonce },
        );
    }, [originalNonce, txid]);

    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const status = account
        ? getEvmPendingTxStatus({ txid, trackedTransaction, expectedPurpose })
        : null;

    useEffect(() => {
        if (status !== 'pending' || !account?.key) {
            return undefined;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account?.key }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [status, account?.key, dispatch, pollIntervalMs]);

    return { status, nonce: originalNonce ?? knownNonce };
};
