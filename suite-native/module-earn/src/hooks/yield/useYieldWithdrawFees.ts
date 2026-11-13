import { useCallback } from 'react';

import {
    type ComposeYieldWithdrawErrorReason,
    type ResolvedYieldFlowData,
    type YieldWithdrawFlowType,
    composeYieldWithdrawTransactionThunk,
    getYieldWithdrawInputToken,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { useFreshRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { getYieldWithdrawFormDraftKey } from '../../utils/yield/yieldWithdrawUtils';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';
import {
    type ComposeTxResult,
    type ComposedTxBase,
    usePreparedTxFees,
} from '../earn/usePreparedTxFees';

type UseYieldWithdrawFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    onComposeError?: (reason: ComposeYieldWithdrawErrorReason) => void;
    amount: string;
    flowType: YieldWithdrawFlowType;
    isEnabled: boolean;
};

export const useYieldWithdrawFees = ({
    amount,
    flowType,
    flowData,
    flowKey,
    isEnabled,
    onComposeError,
}: UseYieldWithdrawFeesParams) => {
    const { dispatch } = useServices(injectDispatch);
    const flowDataRef = useFreshRef(flowData);
    const formDraftKey = flowKey ? getYieldWithdrawFormDraftKey(flowKey) : '';
    const composeTransaction = useCallback(
        async (
            composeAmount: string,
        ): Promise<ComposeTxResult<ComposedTxBase, ComposeYieldWithdrawErrorReason>> => {
            const currentFlowData = flowDataRef.current;
            if (!currentFlowData || !flowKey) return { type: 'error' };

            // Refresh rates before preparation; stored rates remain usable if refreshing fails.
            await dispatch(updateFeeInfoThunk({ networkSymbol: currentFlowData.account.symbol }));
            const result = await dispatch(
                composeYieldWithdrawTransactionThunk({
                    flowData: currentFlowData,
                    amount: composeAmount,
                    flowType,
                }),
            ).unwrap();

            return result.type === 'error'
                ? { type: 'error', reason: result.reason }
                : {
                      type: 'ready',
                      transaction: {
                          symbol: currentFlowData.account.symbol,
                          token: getYieldWithdrawInputToken({
                              flowData: currentFlowData,
                              flowType,
                          }),
                          unsignedTransaction: result.unsignedTransaction,
                      },
                  };
        },
        [dispatch, flowDataRef, flowKey, flowType],
    );
    const fees = usePreparedTxFees({
        amount,
        analyticsFlow: flowType === 'redeem' ? 'yield-redeem' : 'yield-withdraw',
        availableBalance: flowData?.account.availableBalance,
        composeTransaction,
        contextKey: `${formDraftKey}/${flowType}`,
        formDraftKey,
        hasInvalidContext: !amount || !flowData || !flowKey,
        isEnabled,
        symbol: flowData?.account.symbol,
        onComposeError,
        fallbackReason: 'fee-estimation-failed',
    });

    return {
        fee: fees.isFeeUnavailable ? null : (fees.preparedTx?.feePreview.fee ?? null),
        getCustomFeeLevel: fees.getCustomFeeLevel,
        formDraft: fees.formDraft,
        formDraftKey,
        hasFeeEstimationError: fees.hasFeeEstimationError,
        isComposingWithdrawFee: fees.isFeePreparing,
        isCustomFeeReplaced: fees.isCustomFeeReplaced,
        onFeeConfirmed: fees.onFeeConfirmed,
        isFeeUnavailable: fees.isFeeUnavailable,
        isWithdrawFeeReady: fees.isFeeReady,
        preparedAction: fees.preparedTx
            ? {
                  amount: fees.preparedTx.amount,
                  unsignedTransaction: fees.preparedTx.unsignedTransaction,
              }
            : null,
        retryFeeEstimation: fees.retryFeeEstimation,
        selectedFee: fees.selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
