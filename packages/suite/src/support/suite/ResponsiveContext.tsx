import React, { createContext, useContext, useState } from 'react';

import { SIDEBAR_COLLAPSED_WIDTH } from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';
import { useSelector } from '../../hooks/suite';

type ResponsiveContextType = {
    sidebarWidth?: number;
    setSidebarWidth: (sidebarWidth: number) => void;
    contentWidth?: number;
    setContentWidth: (contentWidth: number) => void;
    isSidebarCollapsed: boolean;
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const sidebarWidthFromRedux = useSelector(state => state.suite.settings.sidebarWidth);
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
