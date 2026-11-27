import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type Account, type EvmTransactionPurpose } from '@suite-common/wallet-types';
import {
    type EvmPendingTxStatus,
    type EvmTransactionCall,
    findTrackedEvmTransaction,
    getEvmPendingTxStatus,
    getPollIntervalMs,
    getTrackedWrappedNativeTxid,
} from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
    txid: string | null;
    status: EvmPendingTxStatus | null;
    nonce: number | undefined;
}

type UseEvmPendingTxStatusParams = {
    account: Account | null;
    txid: string | null;
    expectedPurpose: EvmTransactionPurpose;
    persistedNonce?: number;
    expectedCall?: EvmTransactionCall;
};

export const useEvmPendingTxStatus = ({
    account,
    txid,
    expectedPurpose,
    persistedNonce,
    expectedCall,
}: UseEvmPendingTxStatusParams): EvmPendingTxTracking => {
    const { dispatch } = useServices(injectDispatch);

    const transactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, account?.key ?? null),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const [trackedNonce, setTrackedNonce] = useState<TrackedNonce | null>(null);

    const knownNonce =
        persistedNonce ?? (trackedNonce?.txid === txid ? trackedNonce.nonce : undefined);

    const trackedTransaction = txid
        ? findTrackedEvmTransaction({ transactions, txid, nonce: knownNonce, expectedCall })
        : undefined;

    const nonce = trackedTransaction?.transaction.ethereumSpecific?.nonce ?? knownNonce;

    useEffect(() => {
        if (!txid || nonce === undefined || persistedNonce !== undefined) return;

        setTrackedNonce(current =>
            current?.txid === txid && current.nonce === nonce ? current : { txid, nonce },
        );
    }, [nonce, persistedNonce, txid]);

    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const status = account
        ? getEvmPendingTxStatus({ txid, trackedTransaction, expectedPurpose, expectedCall })
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

    return {
        status,
        nonce,
        txid: getTrackedWrappedNativeTxid({ txid, trackedTransaction, expectedCall }),
    };
};
