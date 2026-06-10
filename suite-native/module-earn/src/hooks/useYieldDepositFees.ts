import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { composeYieldDepositTransactionThunk } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { useDebounce } from '@trezor/react-utils';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';

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

export const useYieldDepositFees = ({
    amount,
    flowData,
    flowKey,
    isEnabled,
}: UseYieldDepositFeesParams) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [preparedAction, setPreparedAction] = useState<PreparedYieldDepositAction | null>(null);
    const [isPreparingDepositFee, setIsPreparingDepositFee] = useState(false);

    const clearDepositFeeState = useCallback(() => {
        setPreparedAction(null);
        setIsPreparingDepositFee(false);
    }, []);

    const prepareDepositFeeParams = useMemo(() => {
        if (!isEnabled || !amount || !flowData || !flowKey) {
            return null;
        }

        return { amount, flowData };
    }, [amount, flowData, flowKey, isEnabled]);

    const prepareDepositFee = useCallback(
        async (
            {
                amount: preparedAmount,
                flowData: preparedFlowData,
            }: NonNullable<typeof prepareDepositFeeParams>,
            requestId: number,
        ) => {
            try {
                const result = await dispatch(
                    composeYieldDepositTransactionThunk({
                        amount: preparedAmount,
                        flowData: preparedFlowData,
                    }),
                ).unwrap();

                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (result.type !== 'action-ready') {
                    clearDepositFeeState();

                    return;
                }

                const feePreview = buildYieldDepositFeePreview(result.unsignedTransaction);

                if (!feePreview) {
                    clearDepositFeeState();

                    return;
                }

                setPreparedAction({
                    amount: preparedAmount,
                    feePreview,
                    receiptAmount: result.receiptAmount,
                    unsignedTransaction: result.unsignedTransaction,
                });
                setIsPreparingDepositFee(false);
            } catch {
                if (requestId === requestIdRef.current) {
                    clearDepositFeeState();
                }
            }
        },
        [clearDepositFeeState, dispatch],
    );

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!prepareDepositFeeParams) {
            clearDepositFeeState();

            return;
        }

        setPreparedAction(null);
        setIsPreparingDepositFee(true);
        void debounce(() => void prepareDepositFee(prepareDepositFeeParams, requestId));
    }, [clearDepositFeeState, debounce, prepareDepositFee, prepareDepositFeeParams]);

    return {
        feePreview: preparedAction?.feePreview ?? null,
        isPreparingDepositFee: !!prepareDepositFeeParams && isPreparingDepositFee,
        preparedAction,
    };
};
