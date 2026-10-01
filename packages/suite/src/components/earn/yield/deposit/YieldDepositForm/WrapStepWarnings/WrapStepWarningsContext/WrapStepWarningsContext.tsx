import { type ReactNode, createContext } from 'react';

import {
    type WrapStepWarningsContextValue,
    useWrapStepWarningsContextValue,
} from './hooks/useWrapStepWarningsContextValue';

export const WrapStepWarningsContext = createContext<WrapStepWarningsContextValue | null>(null);
WrapStepWarningsContext.displayName = 'WrapStepWarningsContext';

type WrapStepWarningsProviderProps = {
    children: ReactNode;
};

export const WrapStepWarningsProvider = ({ children }: WrapStepWarningsProviderProps) => {
    const contextValue = useWrapStepWarningsContextValue();

    return (
        <WrapStepWarningsContext.Provider value={contextValue}>
            {children}
        </WrapStepWarningsContext.Provider>
    );
};
