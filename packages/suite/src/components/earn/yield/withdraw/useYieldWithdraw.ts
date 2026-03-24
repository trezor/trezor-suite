import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { YieldWithdrawContextValues } from './useYieldWithdrawContext';
import type { YieldFlowFormValues } from '../common/types';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldFlowSteps } from '../hooks/useYieldFlowSteps';

export const useYieldWithdraw = (): YieldWithdrawContextValues | null => {
    const flow = useYieldFlowSteps();
    const { goToStep } = flow;
    const [approveAmount, setApproveAmount] = useState('0');
    const [withdrawAmount, setWithdrawAmount] = useState('0');
    const methods = useForm<YieldFlowFormValues>({
        defaultValues: {
            amountInput: '0',
        },
    });

    const suppliedAmount = '0';
    const { token, receiptToken, flowKey } = useResolvedYieldFlowData();

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        setApproveAmount(suppliedAmount);
        setWithdrawAmount(suppliedAmount);
        methods.reset({ amountInput: suppliedAmount });
        goToStep('approve');
    }, [flowKey, goToStep, methods, suppliedAmount]);

    if (!token || !receiptToken) {
        return null;
    }

    const maxAmount = suppliedAmount;
    const setApproveMaxAmount = () => {
        setApproveAmount(maxAmount);
    };
    const setWithdrawMaxAmount = () => {
        setWithdrawAmount(maxAmount);
    };

    return {
        token,
        receiptToken,
        suppliedAmount,
        maxAmount,
        approveAmount,
        withdrawAmount,
        completedAmount: withdrawAmount,
        setApproveAmount,
        setWithdrawAmount,
        setApproveMaxAmount,
        setWithdrawMaxAmount,
        methods,
        flow,
    };
};
