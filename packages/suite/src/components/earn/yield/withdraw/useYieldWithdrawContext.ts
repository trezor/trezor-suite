import { createContext, useContext } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { YieldFlowDisplayToken, YieldFlowFormValues } from '../common/types';
import type { UseYieldFlowStepsResult } from '../hooks/useYieldFlowSteps';

export type YieldWithdrawContextValues = {
    token: YieldFlowDisplayToken;
    receiptToken: YieldFlowDisplayToken;
    suppliedAmount: string;
    maxAmount: string;
    approveAmount: string;
    withdrawAmount: string;
    completedAmount: string;
    setApproveAmount: (amount: string) => void;
    setWithdrawAmount: (amount: string) => void;
    setApproveMaxAmount: () => void;
    setWithdrawMaxAmount: () => void;
    methods: UseFormReturn<YieldFlowFormValues>;
    flow: UseYieldFlowStepsResult;
};

export const YieldWithdrawContext = createContext<YieldWithdrawContextValues | null>(null);
YieldWithdrawContext.displayName = 'YieldWithdrawContext';

export const useYieldWithdrawContext = () => {
    const context = useContext(YieldWithdrawContext);

    if (context === null) {
        throw Error('YieldWithdrawContext used without Context');
    }

    return context;
};
