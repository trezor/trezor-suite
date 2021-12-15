import { Linking } from 'react-native';
import {
    NavigationActions,
    StackActions,
    NavigationState,
    NavigationAction,
} from 'react-navigation';
import { DrawerActions } from 'react-navigation-drawer';
import { Route, RouterAppWithParams } from '@suite-constants/routes';
import {
    getRoute,
    findRoute,
    getAppWithParams,
    RouteParams,
    findRouteByName,
    getTopLevelRoute,
} from '@suite-utils/router';
import { ROUTER } from '@suite-actions/constants';
import {
    getNavigator,
    getNavigatorState,
    getActiveRoute,
    isDrawerOpened,
} from '@native/support/suite/NavigatorService';

import { GetState, Dispatch } from '@suite-types';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    payload: {
        url: string;
        pathname: string;
        hash?: string;
    } & RouterAppWithParams;
}

export type RouterAction = LocationChange;

/**
 * Check if router is not locked
 * Called from `goto`, `onLocationChange` and `back`
 */
const isRouterUnlocked = () => (_dispatch: Dispatch, _getState: GetState) =>
    // const { locks } = getState().suite;
    // return !locks.includes(SUITE.LOCK_TYPE.ROUTER) && !locks.includes(SUITE.LOCK_TYPE.UI);
    true;
/**
 * Handle changes of Navigation state
 * Called from `@native/support/suite/Router`
 * @param {string} url
 */
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const unlocked = dispatch(isRouterUnlocked());
    if (!unlocked) return;
    const { router } = getState();
    if (router.pathname === url && router.app !== 'unknown') return null;

    const [pathname, hash] = url.split('#');

    return dispatch({
        type: ROUTER.LOCATION_CHANGE,
        payload: {
            url,
            pathname,
            hash,
            ...getAppWithParams(url),
        },
        url,
    });
};

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    // check if location was not already changed by initialRedirection
    if (getState().router.app === 'unknown') {
        dispatch(onLocationChange(getRoute('suite-index')));
    }
};

/**
 * Links inside of application
 * Called from any view component
 * @param {Route['name']} routeName
 * @param {RouteParams|undefined} params
 * @param {boolean} preserveParams
 */
export const goto =
    (routeName: Route['name'], params?: RouteParams, _preserveParams = false) =>
    (dispatch: Dispatch) => {
        const navigator = getNavigator();
        const state = getNavigatorState();
        if (!navigator) {
            console.warn('Navigator not found');
            return;
        }
        if (!state) {
            console.warn('Navigator state not found');
            return;
        }
        const unlocked = dispatch(isRouterUnlocked());
        if (!unlocked) return;

        const requestedRoute = findRouteByName(routeName);
        const isForegroundApp = requestedRoute && requestedRoute.isForegroundApp;

        const pathname = getRoute(routeName);
        const navigatorRoute = getActiveRoute(state);
        const currentApp = getAppWithParams(navigatorRoute.routeName);
        const nextApp = getAppWithParams(pathname);

        if (isForegroundApp) {
            // Application modals (Onboarding, FW Update, Backup, Select Device...)
            // display as a second child on top of root stack
            navigator.dispatch(
                StackActions.push({
                    routeName: pathname,
                    params: {
                        routeParams: params,
                    },
                }),
            );
        } else if (currentApp.app !== nextApp.app) {
            // Application change ("/wallet" > "/settings")
            // check if requested url has topLevelRoute route and dispatch second action
            const topLevelRoute = getTopLevelRoute(pathname);
            const action = topLevelRoute
                ? NavigationActions.navigate({
                      routeName: pathname,
                      params: {
                          routeParams: params,
                          // TODO: pass navigationOptions?
                      },
                  })
                : undefined;

            // Navigation flow: reset root stack > navigate to requested route (topLevel) > additionally navigate to nested route
            navigator.dispatch(
                StackActions.reset({
                    index: 0,
                    key: null,
                    actions: [
                        NavigationActions.navigate({
                            routeName: topLevelRoute || pathname,
                            action,
                        }),
                    ],
                }),
            );
        } else {
            // TODO: Catch same url here "/" > "/"
            // Nested route change (use case: Account #1 > Account #2)
            if (isDrawerOpened(state)) {
                navigator.dispatch(DrawerActions.closeDrawer());
            }
            navigator.dispatch(
                NavigationActions.navigate({
                    routeName: pathname,
                    params: {
                        routeParams: params,
                        // TODO: pass navigationOptions?
                    },
                }),
            );
        }
    };

/**
 * External links
 * Called from any view component
 * @param {string} url
 */
export const gotoUrl = (url: string) => {
    Linking.openURL(url);
};

/**
 * Handle Android hardware back button
 * Called from `@native/support/suite/Router`
 */
export const androidBack = () => () => {
    const navigator = getNavigator();
    const state = getNavigatorState();
    if (navigator && isDrawerOpened(state)) {
        navigator.dispatch(NavigationActions.back());
    }
    return true; // always return true to block android behavior
};

/**
 * Handle changes of Navigation state
 * Called from `@native/support/suite/Router`
 */
export const onNavigationStateChange =
    (
        _oldState: NavigationState,
        newState: NavigationState,
        action: NavigationAction & { routeName?: string },
    ) =>
    (dispatch: Dispatch): void => {
        if (
            action.routeName ||
            action.type === NavigationActions.BACK ||
            action.type === StackActions.RESET
        ) {
            const navigatorRoute = getActiveRoute(newState);
            const { routeName } = navigatorRoute;
            const suiteRoute = findRoute(routeName);
            const params = navigatorRoute.params ? navigatorRoute.params.routeParams : undefined;
            // params in browser version of @suite/routerReducer are parsed from window.location hash # (url: string)
            // to keep it compatible convert params to string
            // TODO: consider rewrite `onLocationChange` and `routerReducer` to accept params as object
            dispatch(onLocationChange(suiteRoute ? getRoute(suiteRoute.name, params) : routeName));
        }
    };

/**
 * Request previous screen in stack
 * Should be called only from "modal routes" like "Backup" or "Firmware update"
 */
export const back = () => (dispatch: Dispatch) => {
    const unlocked = dispatch(isRouterUnlocked());
    if (!unlocked) return;

    const navigator = getNavigator();
    const state = getNavigatorState();
    if (!navigator) return;

    // TODO: investigate more
    // IDK if it's a 'react-navigation' bug or i'm doing something wrong
    // NavigationActions.back() doesn't work as expected in this case
    // whenever previous route has more than 2 nested navigators (so 100% cases) back action will render only first nested (Drawer)
    if (!state || state.routes.length < 2 || state.index === 0) {
        // fallback
        dispatch(goto('suite-index'));
        return;
    }
    const firstRoute = state.routes[0];
    const currentRoute = getActiveRoute(firstRoute);
    navigator.dispatch(
        StackActions.reset({
            index: 0,
            actions: [
                NavigationActions.navigate({
                    routeName: firstRoute.routeName,
                    action: NavigationActions.navigate({
                        routeName: currentRoute.routeName,
                        params: currentRoute.params,
                    }),
                }),
            ],
        }),
    );

    // navigator.dispatch(NavigationActions.back());
};

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to onboarding if `suite.initialRun` is set to true
 */
export const initialRedirection = () => async (dispatch: Dispatch, getState: GetState) => {
    const { initialRun } = getState().suite.flags;
    const unlocked = dispatch(isRouterUnlocked());
    if (initialRun && unlocked) {
        await dispatch(onLocationChange(getRoute('onboarding-index')));
    }
};

export const closeModalApp = () => (dispatch: Dispatch) => {
    dispatch(back());
};
