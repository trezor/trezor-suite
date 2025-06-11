import React, { createContext, useContext, useRef } from 'react';

type AccountHeaderContextValue = {
    balanceSectionRef: React.RefObject<HTMLDivElement | null>;
};

const AccountHeaderContext = createContext<AccountHeaderContextValue | null>(null);

interface AccountHeaderProviderProps {
    children: React.ReactNode;
}

export const AccountHeaderProvider = ({ children }: AccountHeaderProviderProps) => {
    const balanceSectionRef = useRef<HTMLDivElement>(null);

    return (
        <AccountHeaderContext.Provider value={{ balanceSectionRef }}>
            {children}
        </AccountHeaderContext.Provider>
    );
};

export const useOptionalAccountHeaderContext = () => useContext(AccountHeaderContext) ?? null;

export const useAccountHeaderContext = () => {
    const ctx = useOptionalAccountHeaderContext();
    if (!ctx) throw new Error('Missing provider');

    return ctx;
};
