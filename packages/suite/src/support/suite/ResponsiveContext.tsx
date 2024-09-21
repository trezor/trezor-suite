import React, { createContext, useContext, useState } from 'react';

type ResponsiveContextType = {
    sidebarWidth?: number;
    setSidebarWidth: (sidebarWidth: number) => void;
    contentWidth?: number;
    setContentWidth: (contentWidth: number) => void;
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [sidebarWidth, setSidebarWidth] = useState<number | undefined>(undefined);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);

    const value: ResponsiveContextType = {
        sidebarWidth,
        setSidebarWidth,
        contentWidth,
        setContentWidth,
    };

    return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
};

export const useResponsiveContext = () => {
    const context = useContext(ResponsiveContext);
    if (!context) {
        throw new Error('useResponsiveContext must be used within a ResponsiveContextProvider');
    }

    return context;
};
