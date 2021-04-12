import {
    NavigationContainerComponent,
    NavigationStateRoute,
    NavigationParams,
    NavigationState,
} from 'react-navigation';
import { RouteParams } from '@suite-utils/router';

// custom Navigation state with optional fields and types for Navigator.state.params
export type RouteState = NavigationStateRoute<{
    routeParams: RouteParams; // used in LOCATION.CHANGE action
    navigationOptions: NavigationParams; // used in Navigation state
}> & {
    isDrawerOpen?: boolean; // instead of import { NavigationDrawerState } from 'react-navigation-drawer';
};

// NavigationContainerComponent.state is wrapped in to "nav" object (react-navigation bug?)
type FixedNavigationContainerComponent = NavigationContainerComponent & {
    dispatch: NavigationContainerComponent['dispatch'];
    state: NavigationContainerComponent['state'] & {
        nav?: RouteState;
    };
};

let Navigator: FixedNavigationContainerComponent | typeof undefined | null;

export const setNavigator = (n: FixedNavigationContainerComponent | null) => {
    Navigator = n;
};

export const getNavigator = () => Navigator;

// This is needed only because of FixedNavigationContainerComponent (state.nav)
export const getNavigatorState = () => {
    if (Navigator) return Navigator.state.nav;
};

// Utilities:
export const getActiveRoute = (state: NavigationState): RouteState => {
    if (!state.routes || state.routes.length === 0 || state.index >= state.routes.length) {
        return state as RouteState;
    }
    const childActiveRoute = state.routes[state.index] as RouteState;
    return getActiveRoute(childActiveRoute);
};

export const isDrawerOpened = (state?: RouteState): boolean => {
    if (!state) return false;
    if (state.isDrawerOpen) return true;
    if (!state.routes || state.routes.length === 0) {
        return false;
    }
    const childActiveRoute = state.routes[state.index] as RouteState;
    return isDrawerOpened(childActiveRoute);
};
