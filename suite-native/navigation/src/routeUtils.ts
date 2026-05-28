import type { NavigationState } from '@react-navigation/routers';

import { getCurrentRouteName } from './currentRoute';
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
 * Used by useNavigationRouteMatch to walk the local navigator's state passed via useNavigation().
 */
export const getActiveRouteName = (state: AppNavigationState): string | undefined => {
    if (!state?.routes || state.index == null) return undefined;

    const { routes, index } = state;
    // @ts-expect-error: noUncheckedIndexedAccess
    const route: (typeof routes)[number] = routes[index];

    if (route.state) return getActiveRouteName(route.state as AppNavigationState);

    return route.params?.screen ?? route.name;
};

export const checkIsRouteAnyOf = (routeList: string[], route?: string): boolean => {
    if (!route) return false;

    return routeList.includes(route);
};

export const checkIsActiveRouteAnyOf = (routeList: string[]): boolean =>
    checkIsRouteAnyOf(routeList, getCurrentRouteName());

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
