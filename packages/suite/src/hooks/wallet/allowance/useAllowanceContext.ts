import { createContext, useContext } from 'react';

import { useAllowanceState } from './useAllowanceState';
import { useAllowanceTxTracking } from './useAllowanceTxTracking';

export interface AllowanceContextValue {
    tx: ReturnType<typeof useAllowanceTxTracking>;
    state: ReturnType<typeof useAllowanceState>;
}

export const AllowanceContext = createContext<AllowanceContextValue | null>(null);
AllowanceContext.displayName = 'AllowanceContext';

export const useAllowanceContext = () => {
    const context = useContext(AllowanceContext);
    if (context === null) {
        throw new Error('useAllowanceContext must be used within AllowanceContext.Provider');
    }

    return context;
};
