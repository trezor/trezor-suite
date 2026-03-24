import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { YieldSupplyContextValues } from './useYieldSupplyContext';
import type { YieldFlowFormValues } from '../common/types';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldFlowSteps } from '../hooks/useYieldFlowSteps';

export const useYieldSupply = (): YieldSupplyContextValues | null => {
    const flow = useYieldFlowSteps();
    const { goToStep } = flow;
    const [approveAmount, setApproveAmount] = useState('0');
    const [supplyAmount, setSupplyAmount] = useState('0');
    const methods = useForm<YieldFlowFormValues>({
        defaultValues: {
            amountInput: '0',
        },
    });
    const { token, receiptToken, apy, flowKey } = useResolvedYieldFlowData();
    const defaultAmount = token?.balance;

    useEffect(() => {
        if (!flowKey || !defaultAmount) {
            return;
        }

        setApproveAmount(defaultAmount);
        setSupplyAmount(defaultAmount);
        methods.reset({ amountInput: defaultAmount });
        goToStep('approve');
    }, [defaultAmount, flowKey, goToStep, methods]);

    if (!token || !receiptToken) {
        return null;
    }

    const maxAmount = token.balance;
    const setApproveMaxAmount = () => {
        setApproveAmount(maxAmount);
    };
    const setSupplyMaxAmount = () => {
        setSupplyAmount(maxAmount);
    };

    return {
        token,
        receiptToken,
        apy,
        approveAmount,
        supplyAmount,
        completedAmount: supplyAmount,
        maxAmount,
        setApproveAmount,
        setSupplyAmount,
        setApproveMaxAmount,
        setSupplyMaxAmount,
        methods,
        flow,
    };
};
