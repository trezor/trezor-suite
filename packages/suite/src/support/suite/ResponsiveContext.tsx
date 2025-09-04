import React, { createContext, useContext, useEffect, useState } from 'react';

import { SIDEBAR_COLLAPSED_WIDTH } from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';
import { useSelector } from '../../hooks/suite';

type ResponsiveContextType = {
    sidebarWidth?: number;
    setSidebarWidth: (sidebarWidth: number) => void;
    contentWidth?: number;
    setContentWidth: (contentWidth: number) => void;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const sidebarWidthFromRedux = useSelector(state => state.suite.settings.sidebarWidth);
    const [sidebarWidth, setSidebarWidth] = useState<number>(sidebarWidthFromRedux);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
    const [forcedSidebarCollapsed, setForcedSidebarCollapsed] = useState<boolean>(false);

    const value: ResponsiveContextType = {
        sidebarWidth,
        setSidebarWidth,
        contentWidth,
        setContentWidth,
        isSidebarCollapsed: sidebarWidth ? sidebarWidth < SIDEBAR_COLLAPSED_WIDTH : false,
        setIsSidebarCollapsed: setForcedSidebarCollapsed,
    };

    return (
        <ResponsiveContext.Provider
            value={{
                ...value,
                isSidebarCollapsed: forcedSidebarCollapsed || value.isSidebarCollapsed,
                sidebarWidth: forcedSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : value.sidebarWidth,
            }}
        >
            {children}
        </ResponsiveContext.Provider>
    );
};

export const useResponsiveContext = ({
    forceIsSidebarCollapsed,
}: {
    forceIsSidebarCollapsed?: boolean;
} = {}) => {
    const context = useContext(ResponsiveContext);
    const setSidebarCollapsed = context?.setIsSidebarCollapsed;

    useEffect(() => {
        if (typeof forceIsSidebarCollapsed === 'boolean') {
            setSidebarCollapsed?.(forceIsSidebarCollapsed);
        }
    }, [forceIsSidebarCollapsed, setSidebarCollapsed]);

    if (!context) {
        throw new Error('useResponsiveContext must be used within a ResponsiveContextProvider');
    }

    return context;
};
