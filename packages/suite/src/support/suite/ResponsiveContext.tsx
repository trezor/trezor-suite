import React, { createContext, useContext, useMemo, useState } from 'react';

import { selectSidebarWidth } from '@suite/settings';

import {
    SIDEBAR_COLLAPSED_WIDTH,
    SIDEBAR_MIN_WIDTH,
} from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';
import { useSelector } from '../../hooks/suite';

type ResponsiveContextType = {
    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
    lastManualSidebarWidth: number;
    forcedSidebarWidth?: number;
    setForcedSidebarWidth: (width?: number) => void;
    isSidebarCollapsed: boolean;
    contentWidth?: number;
    setContentWidth: (width: number) => void;
    autoCollapsed: boolean;
    setAutoCollapsed: (v: boolean) => void;
    userResizingSidebar: boolean;
    setUserResizingSidebar: (v: boolean) => void;
    autoCollapseSuppressed: boolean;
    setAutoCollapseSuppressed: (v: boolean) => void;
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const sidebarWidthFromRedux = useSelector(selectSidebarWidth);

    const [sidebarWidthManual, setSidebarWidthManual] = useState<number>(sidebarWidthFromRedux);
    const [sidebarWidthRaw, setSidebarWidthRaw] = useState<number>(sidebarWidthFromRedux);
    const [forcedSidebarWidth, setForcedSidebarWidth] = useState<number | undefined>(undefined);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
    const [autoCollapsed, setAutoCollapsed] = useState<boolean>(false);
    const [userResizingSidebar, setUserResizingSidebar] = useState<boolean>(false);
    const [autoCollapseSuppressed, setAutoCollapseSuppressed] = useState<boolean>(false);

    const effectiveWidth = useMemo(
        () => (typeof forcedSidebarWidth === 'number' ? forcedSidebarWidth : sidebarWidthRaw),
        [forcedSidebarWidth, sidebarWidthRaw],
    );

    const isSidebarCollapsed = useMemo(
        () => effectiveWidth < SIDEBAR_COLLAPSED_WIDTH,
        [effectiveWidth],
    );

    const setSidebarWidth = (width: number) => {
        if (typeof forcedSidebarWidth === 'number' && !userResizingSidebar) return;
        const clamped = Math.max(width, SIDEBAR_MIN_WIDTH);
        setSidebarWidthRaw(clamped);
        setSidebarWidthManual(clamped);
    };

    const value: ResponsiveContextType = {
        sidebarWidth: effectiveWidth,
        setSidebarWidth,
        lastManualSidebarWidth: sidebarWidthManual,
        forcedSidebarWidth,
        setForcedSidebarWidth,
        isSidebarCollapsed,
        contentWidth,
        setContentWidth,
        autoCollapsed,
        setAutoCollapsed,
        userResizingSidebar,
        setUserResizingSidebar,
        autoCollapseSuppressed,
        setAutoCollapseSuppressed,
    };

    return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
};

export const useResponsiveContext = () => {
    const ctx = useContext(ResponsiveContext);
    if (!ctx)
        throw new Error('useResponsiveContext must be used within a ResponsiveContextProvider');

    return ctx;
};
