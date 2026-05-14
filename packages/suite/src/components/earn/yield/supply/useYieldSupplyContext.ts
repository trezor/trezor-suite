import { createContext, useContext } from 'react';

import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

export const YieldSupplyContext = createContext<YieldFlowContextValues | null>(null);
YieldSupplyContext.displayName = 'YieldSupplyContext';

export const useYieldSupplyContext = () => {
    const context = useContext(YieldSupplyContext);

    if (context === null) {
        throw Error('YieldSupplyContext used without Context');
    }

    return context;
};
