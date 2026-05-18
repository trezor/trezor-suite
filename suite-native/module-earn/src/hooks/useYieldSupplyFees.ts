import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { prepareYieldDepositAction } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { useDebounce } from '@trezor/react-utils';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { buildYieldSupplyFeePreview } from '../yieldSupplyFeeUtils';

export type PreparedYieldSupplyAction = {
    amount: string;
    feePreview: PrecomposedTransactionFinal;
    receiptAmount: string;
    unsignedTransaction: string;
};

type UseYieldSupplyFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    isEnabled: boolean;
};

export const useYieldSupplyFees = ({
    amount,
    flowData,
    flowKey,
    isEnabled,
}: UseYieldSupplyFeesParams) => {
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [preparedAction, setPreparedAction] = useState<PreparedYieldSupplyAction | null>(null);
    const [isPreparingSupplyFee, setIsPreparingSupplyFee] = useState(false);

    const clearSupplyFeeState = useCallback(() => {
        setPreparedAction(null);
        setIsPreparingSupplyFee(false);
    }, []);

    const prepareSupplyFeeParams = useMemo(() => {
        if (!isEnabled || !amount || !flowData || !flowKey) {
            return null;
        }

        return { amount, flowData };
    }, [amount, flowData, flowKey, isEnabled]);

    const prepareSupplyFee = useCallback(
        async (
            {
                amount: preparedAmount,
                flowData: preparedFlowData,
            }: NonNullable<typeof prepareSupplyFeeParams>,
            requestId: number,
        ) => {
            try {
                const result = await prepareYieldDepositAction({
                    amount: preparedAmount,
                    flowData: preparedFlowData,
                });

                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (result.type !== 'action-ready') {
                    clearSupplyFeeState();

                    return;
                }

                const feePreview = buildYieldSupplyFeePreview(result.unsignedTransaction);

                if (!feePreview) {
                    clearSupplyFeeState();

                    return;
                }

                setPreparedAction({
                    amount: preparedAmount,
                    feePreview,
                    receiptAmount: result.receiptAmount,
                    unsignedTransaction: result.unsignedTransaction,
                });
                setIsPreparingSupplyFee(false);
            } catch {
                if (requestId === requestIdRef.current) {
                    clearSupplyFeeState();
                }
            }
        },
        [clearSupplyFeeState],
    );

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!prepareSupplyFeeParams) {
            clearSupplyFeeState();

            return;
        }

        setPreparedAction(null);
        setIsPreparingSupplyFee(true);
        void debounce(() => void prepareSupplyFee(prepareSupplyFeeParams, requestId));
    }, [clearSupplyFeeState, debounce, prepareSupplyFee, prepareSupplyFeeParams]);

    return {
        feePreview: preparedAction?.feePreview ?? null,
        isPreparingSupplyFee: !!prepareSupplyFeeParams && isPreparingSupplyFee,
        preparedAction,
    };
};
