import { createContext, useContext } from 'react';

import { ModalIntent } from './types';

export const ModalContext = createContext<{
    intent?: ModalIntent;
}>({ intent: undefined });

export const useModalContext = () => {
    const context = useContext(ModalContext);

    if (!context) {
        throw new Error('useModalContext must be used within a ModalContext');
    }

    return context;
};
