import type React from 'react';

import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

type Props = {
    children: React.ReactNode;
};

export const CollapsedSidebarOnly = ({ children }: Props) => {
    const { isSidebarCollapsed } = useResponsiveContext();
    if (!isSidebarCollapsed) return null;

    return children;
};
