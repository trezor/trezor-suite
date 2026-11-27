import { useEffect } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { type EvmTransactionCall, fromHex } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';

import {
    type EvmPendingTxTracking,
    useEvmPendingTxStatus,
} from '../../transactions/hooks/useEvmPendingTxStatus';
import {
    buildYieldUnwrapTransactionData,
    buildYieldWrapTransactionData,
} from '../utils/yieldUtils';
import { yieldActions } from '../yieldReducer';
import { type YieldFlowType, type YieldPendingTransactionState } from '../yieldTypes';

type PendingYieldCall = Pick<YieldPendingTransactionState, 'type' | 'txid' | 'amount' | 'nonce'>;

const getExpectedWrappedNativeCall = (
    account: Account | null,
    pendingTransaction: PendingYieldCall | null | undefined,
): EvmTransactionCall | undefined => {
    if (
        !account ||
        (pendingTransaction?.type !== 'wrap' && pendingTransaction?.type !== 'unwrap')
    ) {
        return undefined;
    }

    const token = getWrappedNativeToken(account.symbol);
    if (!token) return undefined;

    const { amount, type } = pendingTransaction;
    const { address: to, decimals } = token;
    // Rebuild the call from the submitted amount so existing pending sessions can also
    // validate a replacement after the original transaction has left the account history.
    try {
        if (type === 'wrap') {
            const { data, value } = buildYieldWrapTransactionData({ wrapAmount: amount, decimals });

            return { to, data, value: fromHex(value).toIntegerString() };
        }

        const { data } = buildYieldUnwrapTransactionData({ unwrapAmount: amount, decimals });

        return { to, data, value: '0' };
    } catch {
        return undefined;
    }
};

export const useYieldEvmPendingTxStatus = (
    account: Account | null,
    pendingTransaction: PendingYieldCall | null | undefined,
): EvmPendingTxTracking =>
    useEvmPendingTxStatus({
        account,
        txid: pendingTransaction?.txid ?? null,
        expectedPurpose: pendingTransaction?.type ?? '',
        persistedNonce: pendingTransaction?.nonce,
        expectedCall: getExpectedWrappedNativeCall(account, pendingTransaction),
    });

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
}: UseYieldPendingTxStatusParams): EvmPendingTxTracking => {
    const { dispatch } = useServices(injectDispatch);

    const tracking = useYieldEvmPendingTxStatus(account, pendingTransaction);
    const { nonce } = tracking;

    const txid = pendingTransaction?.txid;
    const storedNonce = pendingTransaction?.nonce;

    useEffect(() => {
        if (!flowKey || !txid || nonce === undefined || nonce === storedNonce) return;

        dispatch(yieldActions.setPendingTxNonce({ flowType, flowKey, txid, nonce }));
    }, [dispatch, flowKey, flowType, nonce, storedNonce, txid]);

    return tracking;
};
