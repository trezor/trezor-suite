import { createContext, useContext } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { YieldFlowDisplayToken, YieldFlowFormValues, YieldFlowToken } from '../common/types';
import type { UseYieldFlowStepsResult } from '../hooks/useYieldFlowSteps';

export type YieldSupplyContextValues = {
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
    apy: number | null;
    approveAmount: string;
    supplyAmount: string;
    completedAmount: string;
    maxAmount: string;
    setApproveAmount: (amount: string) => void;
    setSupplyAmount: (amount: string) => void;
    setApproveMaxAmount: () => void;
    setSupplyMaxAmount: () => void;
    methods: UseFormReturn<YieldFlowFormValues>;
    flow: UseYieldFlowStepsResult;
};

export const YieldSupplyContext = createContext<YieldSupplyContextValues | null>(null);
YieldSupplyContext.displayName = 'YieldSupplyContext';

export const useYieldSupplyContext = () => {
    const context = useContext(YieldSupplyContext);

    if (context === null) {
        throw Error('YieldSupplyContext used without Context');
    }

    return context;
};
