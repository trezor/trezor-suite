import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { RootStackRoutes } from './routes';

export const checkIsRouteAccessAllowed = ({ blacklist }: { blacklist: RootStackRoutes[] }) => {
    const activeRouteName = navigationContainerRef.getState()?.routes.at(-1)
        ?.name as RootStackRoutes;

    if (!activeRouteName) return false;

    return !blacklist.includes(activeRouteName);
};
