import { createContext, useContext } from 'react';
import { WarningVariant } from './Warning';

export const WarningContext = createContext<{
    variant?: WarningVariant;
}>({ variant: undefined });

export const useWarningContextContext = () => {
    const context = useContext(WarningContext);
    if (!context) {
        throw new Error('useWarningContextContext must be used within a WarningContext');
    }

    return context;
};
