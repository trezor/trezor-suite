import React, { createContext, useContext, useState } from 'react';

import {
    SIDEBAR_COLLAPSED_WIDTH,
    SIDEBAR_MIN_WIDTH,
} from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';

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
    isMobileLayout,
}: {
    children: React.ReactNode;
    isMobileLayout: boolean;
    sidebarWidthFromRedux: number;
}) => {
    const [sidebarWidth, setSidebarWidth] = useState<number>(sidebarWidthFromRedux);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);

    const getIsSidebarCollapsed = () => {
        if (isMobileLayout) return true;

        return sidebarWidth ? sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH : false;
    };

    const value: ResponsiveContextType = {
        sidebarWidth: isMobileLayout ? SIDEBAR_MIN_WIDTH : sidebarWidth,
        setSidebarWidth,
        contentWidth,
        setContentWidth,
        isSidebarCollapsed: getIsSidebarCollapsed(),
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
