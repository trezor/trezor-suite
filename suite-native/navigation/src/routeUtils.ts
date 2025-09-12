import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { AppNavigationState, getActiveRouteName } from './hooks/useNavigationRoute';
import {
    AppTabsRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from './routes';

type RouteType = RootStackRoutes | DeviceOnboardingStackRoutes | HomeStackRoutes;
export type Routes = RouteType[];

export const checkIsActiveRouteAnyOf = (routeList: string[]): boolean => {
    const activeRoute = getActiveRouteName(navigationContainerRef.getState() as AppNavigationState);

    if (!activeRoute) return false;

    return routeList.includes(activeRoute);
};

export const checkIsDeviceOnboardingFocused = () => {
    const DEVICE_ONBOARDING_ROUTES = [
        RootStackRoutes.DeviceOnboardingStack,
        ...Object.keys(DeviceOnboardingStackRoutes),
    ];

    return checkIsActiveRouteAnyOf(DEVICE_ONBOARDING_ROUTES);
};

export const checkIsHomeStackFocused = () => {
    const HOME_ROUTES = [HomeStackRoutes.Home, AppTabsRoutes.HomeStack];

    return checkIsActiveRouteAnyOf(HOME_ROUTES);
};
