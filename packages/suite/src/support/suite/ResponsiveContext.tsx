import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectSidebarWidth, suiteSettingsActions } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { throwError } from '@trezor/utils';

import {
    SIDEBAR_COLLAPSED_WIDTH,
    SIDEBAR_MIN_WIDTH,
} from '../../components/suite/layouts/SuiteLayout/Sidebar/consts';
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

export const normalizePersistedSidebarWidth = (width: number) => {
    if (width <= SIDEBAR_MIN_WIDTH) {
        return SIDEBAR_MIN_WIDTH;
    }

    return Math.max(width, SIDEBAR_COLLAPSED_WIDTH);
};

export const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const sidebarWidthFromRedux = useSelector(selectSidebarWidth);
    const dispatch = useDispatch();
    const initialSidebarWidth = normalizePersistedSidebarWidth(sidebarWidthFromRedux);

    const [sidebarWidthManual, setSidebarWidthManual] = useState<number>(initialSidebarWidth);
    const [sidebarWidthRaw, setSidebarWidthRaw] = useState<number>(initialSidebarWidth);
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

    useEffect(() => {
        if (sidebarWidthFromRedux !== initialSidebarWidth) {
            dispatch(suiteSettingsActions.setSidebarWidth(initialSidebarWidth));
        }
    }, [dispatch, initialSidebarWidth, sidebarWidthFromRedux]);

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

export const useResponsiveContext = () =>
    useContext(ResponsiveContext) ??
    throwError('useResponsiveContext must be used within a ResponsiveContextProvider');
