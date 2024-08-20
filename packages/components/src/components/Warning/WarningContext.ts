import { createContext, useContext } from 'react';
import { WarningVariant } from './types';

export const WarningContext = createContext<{
    variant?: WarningVariant;
    isSubtle?: boolean;
}>({ variant: undefined, isSubtle: undefined });

export const useWarningContextContext = () => {
    const context = useContext(WarningContext);
    if (!context) {
        throw new Error('useWarningContextContext must be used within a WarningContext');
    }

    return context;
};
