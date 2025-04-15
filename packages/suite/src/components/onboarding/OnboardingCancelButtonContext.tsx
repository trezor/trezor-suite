import { Dispatch, ReactNode, createContext, useContext, useState } from 'react';

type OnCancelHandler = () => void;

type CancelButtonContextData = {
    onCancelHandler: OnCancelHandler | null;
    setOnCancelHandler: Dispatch<OnCancelHandler> | null;
};

const CancelButtonContext = createContext<CancelButtonContextData>({
    onCancelHandler: null,
    setOnCancelHandler: null,
});

export function OnboardingCancelButtonContext({ children }: { children: ReactNode }) {
    const [onCancelHandler, setOnCancelHandler] = useState<OnCancelHandler | null>(null);

    return (
        <CancelButtonContext.Provider value={{ onCancelHandler, setOnCancelHandler }}>
            {children}
        </CancelButtonContext.Provider>
    );
}

export const useOnboardingCancelButtonContext = () => useContext(CancelButtonContext);
