import { type ReactNode, createContext } from 'react';

import {
    type ApproveStepWarningsContextValue,
    useApproveStepWarningsContextValue,
} from './hooks/useApproveStepWarningsContextValue';

export const ApproveStepWarningsContext = createContext<ApproveStepWarningsContextValue | null>(
    null,
);
ApproveStepWarningsContext.displayName = 'ApproveStepWarningsContext';

type ApproveStepWarningsProviderProps = {
    children: ReactNode;
};

export const ApproveStepWarningsProvider = ({ children }: ApproveStepWarningsProviderProps) => {
    const contextValue = useApproveStepWarningsContextValue();

    return (
        <ApproveStepWarningsContext.Provider value={contextValue}>
            {children}
        </ApproveStepWarningsContext.Provider>
    );
};
