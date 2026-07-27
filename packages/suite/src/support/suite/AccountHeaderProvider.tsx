import React, { createContext, useContext, useRef } from 'react';

type AccountHeaderContextValue = {
    balanceSectionRef: React.RefObject<HTMLDivElement | null>;
};

const AccountHeaderContext = createContext<AccountHeaderContextValue | null>(null);

interface AccountHeaderProviderProps {
    balanceSectionRef?: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}

export const AccountHeaderProvider = ({
    balanceSectionRef: providedBalanceSectionRef,
    children,
}: AccountHeaderProviderProps) => {
    const internalBalanceSectionRef = useRef<HTMLDivElement>(null);
    const balanceSectionRef = providedBalanceSectionRef ?? internalBalanceSectionRef;

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
