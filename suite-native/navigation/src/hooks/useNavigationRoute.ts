import { useNavigationState } from '@react-navigation/native';
import type { NavigationState } from '@react-navigation/routers';

import { AppTabsParamList } from '../navigators';

type AppNavigationState = NavigationState<AppTabsParamList>;
/**
 * Recursively get the most specific active route name from the hierarchy of navigation states.
 */
export const getActiveRouteName = (state: AppNavigationState): string | undefined => {
    if (!state || !state.routes || state.index == null) return undefined;

    const route = state.routes[state.index];

    if (route.state) return getActiveRouteName(route.state as AppNavigationState);

    return route.params?.screen ?? route.name;
};

/**
 * Get the most specific active route name from the hierarchy of navigation states.
 *
 * The value should be same as from useRoute hook provided by lib, but that hook can only be used in
 * components downstream of the stack navigators! In components above the navigators, use this hook.
 */
export const useNavigationRoute = () =>
    useNavigationState(state => getActiveRouteName(state as AppNavigationState));

/**
 * Determine if the most specific active route name matches the query.
 *
 * WARNING: if you need to match a route that is default in its stack, e.g. HomeStack.Home inside HomeStack,
 * you'll need to query both [AppTabs.HomeStack, HomeStack.Home], because if a link in our app leads
 * only to HomeStack, the navigation state will also end with HomeStack, and not show HomeStack.Home.
 *
 * @param routesToBeMatched Route name or array of route names to be matched
 */
export const useNavigationRouteMatch = (routesToBeMatched: string | string[]): boolean => {
    const activeRouteName = useNavigationRoute();
    if (!activeRouteName) return false;

    return typeof routesToBeMatched === 'string'
        ? routesToBeMatched === activeRouteName
        : routesToBeMatched.includes(activeRouteName);
};
