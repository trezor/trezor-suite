import React from 'react';
import { SIDEBAR_COLLAPSED_WIDTH } from './consts';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

type Props = {
    children: React.ReactNode;
};

export const ExpandedSidebarOnly = ({ children }: Props) => {
    const { sidebarWidth } = useResponsiveContext();

    if (sidebarWidth && sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH) return null;

    return children;
};
