import { createContext, useContext } from 'react';

import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

export const YieldWithdrawContext = createContext<YieldFlowContextValues | null>(null);
YieldWithdrawContext.displayName = 'YieldWithdrawContext';

export const useYieldWithdrawContext = () => {
    const context = useContext(YieldWithdrawContext);

    if (context === null) {
        throw Error('YieldWithdrawContext used without Context');
    }

    return context;
};
