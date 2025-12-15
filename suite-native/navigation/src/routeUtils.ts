import type { NavigationState } from '@react-navigation/routers';

import { navigationContainerRef } from './components/NavigationContainerWithAnalytics';
import { type AppTabsParamList } from './navigators';
import {
    AppTabsRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from './routes';

export type AppNavigationState = NavigationState<AppTabsParamList>;

/**
 * Recursively get the most specific active route name from the hierarchy of navigation states.
 */
export const getActiveRouteName = (state: AppNavigationState): string | undefined => {
    if (!state || !state.routes || state.index == null) return undefined;

    const route = state.routes[state.index];

    if (route.state) return getActiveRouteName(route.state as AppNavigationState);

    return route.params?.screen ?? route.name;
};

export const checkIsRouteAnyOf = (routeList: string[], route?: string): boolean => {
    if (!route) return false;

    return routeList.includes(route);
};

export const checkIsActiveRouteAnyOf = (routeList: string[]): boolean => {
    if (!navigationContainerRef.isReady()) return false;

    return checkIsRouteAnyOf(
        routeList,
        getActiveRouteName(navigationContainerRef.getState() as AppNavigationState),
    );
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
