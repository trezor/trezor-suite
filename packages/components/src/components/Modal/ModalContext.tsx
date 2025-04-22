import { createContext, useContext } from 'react';

import { ModalVariant } from './types';

export const ModalContext = createContext<{
    variant?: ModalVariant;
}>({ variant: undefined });

export const useModalContext = () => {
    const context = useContext(ModalContext);

    if (!context) {
        throw new Error('useModalContext must be used within a ModalContext');
    }

    return context;
};
