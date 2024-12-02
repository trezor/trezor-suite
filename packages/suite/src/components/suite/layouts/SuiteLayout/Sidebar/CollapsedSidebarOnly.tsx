import React from 'react';

import { useIsSidebarCollapsed } from './utils';

type Props = {
    children: React.ReactNode;
};

export const CollapsedSidebarOnly = ({ children }: Props) => {
    const isSidebarCollapsed = useIsSidebarCollapsed();
    if (!isSidebarCollapsed) return null;

    return children;
};
