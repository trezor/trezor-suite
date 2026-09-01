import { useCallback, useMemo } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type ResolvedYieldFlowData,
    composeYieldDepositTransactionThunk,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { updateEarnSelectedFeeLevelThunk } from './useComposeEarnFees';
import { type ComposeTxResult, type ComposedTxBase, usePreparedTxFees } from './usePreparedTxFees';
import { getYieldDepositFormDraftKey } from '../utils/yieldDepositUtils';

export type PreparedYieldDepositAction = {
    amount: string;
    feePreview: PrecomposedTransactionFinal;
    receiptAmount: string;
    unsignedTransaction: string;
};

type UseYieldDepositFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    isEnabled: boolean;
};

type ComposedDepositTransaction = ComposedTxBase & { receiptAmount: string };

export const useYieldDepositFees = ({
    amount,
    flowData,
    flowKey,
    isEnabled,
}: UseYieldDepositFeesParams) => {
    const dispatch = useDispatch();

    const formDraftKey = useMemo(
        () => (flowKey ? getYieldDepositFormDraftKey(flowKey) : ''),
        [flowKey],
    );
    const hasInvalidContext = !amount || !flowData || !flowKey || !formDraftKey;

    const composeTransaction = useCallback(
        async (composeAmount: string): Promise<ComposeTxResult<ComposedDepositTransaction>> => {
            if (!flowData) {
                return { type: 'error' };
            }

            try {
                const result = await dispatch(
                    composeYieldDepositTransactionThunk({ amount: composeAmount, flowData }),
                ).unwrap();

                if (result.type !== 'action-ready') {
                    return { type: 'error' };
                }

                return {
                    type: 'ready',
                    transaction: {
                        receiptAmount: result.receiptAmount,
                        symbol: flowData.account.symbol,
                        token: flowData.token,
                        unsignedTransaction: result.unsignedTransaction,
                    },
                };
            } catch {
                return { type: 'error' };
            }
        },
        [dispatch, flowData],
    );

    const fees = usePreparedTxFees({
        amount,
        composeTransaction,
        formDraftKey,
        hasInvalidContext,
        isEnabled,
        symbol: flowData?.account.symbol,
    });

    const preparedAction = useMemo(
        (): PreparedYieldDepositAction | null =>
            fees.preparedTx
                ? {
                      amount: fees.preparedTx.amount,
                      feePreview: fees.preparedTx.feePreview,
                      receiptAmount: fees.preparedTx.transaction.receiptAmount,
                      unsignedTransaction: fees.preparedTx.unsignedTransaction,
                  }
                : null,
        [fees.preparedTx],
    );

    return {
        feePreview: preparedAction?.feePreview ?? null,
        formDraft: fees.formDraft,
        formDraftKey: fees.formDraftKey,
        hasFeeEstimationError: fees.hasFeeEstimationError,
        isDepositFeeReady: fees.isFeeReady,
        isFeeUnavailable: fees.isFeeUnavailable,
        isPreparingDepositFee: fees.isFeePreparing,
        preparedAction,
        retryFeeEstimation: fees.retryFeeEstimation,
        selectedFee: fees.selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
