import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { DeviceOnboardingStackRoutes, HomeStackRoutes, RootStackRoutes } from './routes';

type RouteType = RootStackRoutes | DeviceOnboardingStackRoutes | HomeStackRoutes;
export type Routes = RouteType[];

const getActiveRouteName = () =>
    navigationContainerRef.getState()?.routes.at(-1)?.name as RouteType;

export const checkIsActiveRouteAnyOf = (routeList: Routes) => {
    const activeRouteName = getActiveRouteName();

    if (!activeRouteName) return false;

    return routeList.includes(activeRouteName);
};
