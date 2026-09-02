import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { type EvmPendingTxStatus } from '@suite-common/wallet-utils';

import { useEvmPendingTxStatus } from '../../transactions/hooks/useEvmPendingTxStatus';
import { yieldActions } from '../yieldReducer';
import { type YieldFlowType, type YieldPendingTransactionState } from '../yieldTypes';

interface UseYieldPendingTxStatusParams {
    account: Account | null;
    flowType: YieldFlowType;
    flowKey: string | null;
    pendingTransaction: YieldPendingTransactionState | null | undefined;
}

export const useYieldPendingTxStatus = ({
    account,
    flowType,
    flowKey,
    pendingTransaction,
}: UseYieldPendingTxStatusParams): EvmPendingTxStatus | null => {
    const dispatch = useDispatch();

    const { status, nonce } = useEvmPendingTxStatus(
        account,
        pendingTransaction?.txid ?? null,
        pendingTransaction?.type ?? '',
        pendingTransaction?.nonce,
    );

    const txid = pendingTransaction?.txid;
    const storedNonce = pendingTransaction?.nonce;

    useEffect(() => {
        if (!flowKey || !txid || nonce === undefined || nonce === storedNonce) return;

        dispatch(yieldActions.setPendingTxNonce({ flowType, flowKey, txid, nonce }));
    }, [dispatch, flowKey, flowType, nonce, storedNonce, txid]);

    return status;
};
