import { type ReactNode, createContext } from 'react';

import {
    type ActionStepWarningsContextValue,
    useActionStepWarningsContextValue,
} from './hooks/useActionStepWarningsContextValue';

export const ActionStepWarningsContext = createContext<ActionStepWarningsContextValue | null>(null);
ActionStepWarningsContext.displayName = 'ActionStepWarningsContext';

type ActionStepWarningsProviderProps = {
    children: ReactNode;
};

export const ActionStepWarningsProvider = ({ children }: ActionStepWarningsProviderProps) => {
    const contextValue = useActionStepWarningsContextValue();

    return (
        <ActionStepWarningsContext.Provider value={contextValue}>
            {children}
        </ActionStepWarningsContext.Provider>
    );
};
