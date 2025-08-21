import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { DeviceOnboardingStackRoutes, RootStackRoutes } from './routes';

type RouteType = RootStackRoutes | DeviceOnboardingStackRoutes;
type Routes = RouteType[];

const getActiveRouteName = () =>
    navigationContainerRef.getState()?.routes.at(-1)?.name as RouteType;

export const checkIsActiveRouteAnyOf = (routeList: Routes) => {
    const activeRouteName = getActiveRouteName();

    if (!activeRouteName) return false;

    return routeList.includes(activeRouteName);
};

export const checkIsActiveRouteAnyOfBlacklisted = (blacklist: Routes) =>
    !checkIsActiveRouteAnyOf(blacklist);
