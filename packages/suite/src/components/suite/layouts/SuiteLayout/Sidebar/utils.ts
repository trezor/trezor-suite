import { SIDEBAR_COLLAPSED_WIDTH } from './consts';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

export const useIsSidebarCollapsed = () => {
    const { sidebarWidth } = useResponsiveContext();
    if (!sidebarWidth) return undefined;

    return sidebarWidth < SIDEBAR_COLLAPSED_WIDTH;
};
