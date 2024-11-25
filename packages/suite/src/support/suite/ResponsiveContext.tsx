import React, { createContext, useContext, useState } from 'react';

import { SIDEBAR_COLLAPSED_WIDTH } from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';

type ResponsiveContextType = {
    sidebarWidth?: number;
    setSidebarWidth: (sidebarWidth: number) => void;
    contentWidth?: number;
    setContentWidth: (contentWidth: number) => void;
    isSidebarCollapsed: boolean;
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({
    children,
    sidebarWidthFromRedux,
}: {
    children: React.ReactNode;
    sidebarWidthFromRedux: number;
}) => {
    const [sidebarWidth, setSidebarWidth] = useState<number>(sidebarWidthFromRedux);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);

    const value: ResponsiveContextType = {
        sidebarWidth,
        setSidebarWidth,
        contentWidth,
        setContentWidth,
        isSidebarCollapsed: sidebarWidth ? sidebarWidth < SIDEBAR_COLLAPSED_WIDTH : false,
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
