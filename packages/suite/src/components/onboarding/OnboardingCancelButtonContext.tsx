import { type Dispatch, type ReactNode, createContext, useContext, useState } from 'react';

type OnCancelHandler = () => void;

type CancelButtonContextData = {
    onCancelHandler: OnCancelHandler | null;
    setOnCancelHandler: Dispatch<OnCancelHandler | null> | null;
};

const CancelButtonContext = createContext<CancelButtonContextData>({
    onCancelHandler: null,
    setOnCancelHandler: null,
});

type OnboardingCancelButtonContextProps = { children: ReactNode };

export function OnboardingCancelButtonContext({ children }: OnboardingCancelButtonContextProps) {
    const [onCancelHandler, setOnCancelHandler] = useState<OnCancelHandler | null>(null);

    return (
        <CancelButtonContext.Provider value={{ onCancelHandler, setOnCancelHandler }}>
            {children}
        </CancelButtonContext.Provider>
    );
}

export const useOnboardingCancelButtonContext = () => useContext(CancelButtonContext);
