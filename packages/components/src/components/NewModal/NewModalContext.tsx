import { createContext, useContext } from 'react';
import { NewModalVariant } from './types';

export const NewModalContext = createContext<{
    variant?: NewModalVariant;
}>({ variant: undefined });

export const useNewModalContext = () => {
    const context = useContext(NewModalContext);

    if (!context) {
        throw new Error('useNewModalContext must be used within a NewModalContext');
    }

    return context;
};
