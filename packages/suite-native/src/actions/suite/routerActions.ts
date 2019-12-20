import { Linking } from 'react-native';
import { NavigationActions, StackActions } from 'react-navigation';
import { DrawerActions } from 'react-navigation-drawer';
import { Route } from '@suite-constants/routes';
import {
    getRoute,
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
} from '@suite-support/NavigatorService';

import { GetState, Dispatch } from '@suite-types';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    url: string;
}

export type RouterActions = LocationChange;

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    // check if location was not already changed by initialRedirection
    if (getState().router.app === 'unknown') {
        dispatch({
            type: ROUTER.LOCATION_CHANGE,
            url: getRoute('suite-index'),
        });
    }
};

/**
 * Check if router is not locked
 * Called from `goto`, `onLocationChange` and `back`
 */
const onBeforePopState = () => (_dispatch: Dispatch, _getState: GetState) => {
    // const { locks } = getState().suite;
    // return !locks.includes(SUITE.LOCK_TYPE.ROUTER) && !locks.includes(SUITE.LOCK_TYPE.UI);
    return true;
};

/**
 * Handle changes of window.location and window.location.hash
 * Called from ./support/Router
 * @param {string} url
 */
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const unlocked = dispatch(onBeforePopState());
    if (!unlocked) return;
    const { router } = getState();
    if (router.pathname === url) return null;

    return dispatch({
        type: ROUTER.LOCATION_CHANGE,
        url,
    });
};

// links inside of application
export const goto = (routeName: Route['name'], params?: RouteParams, _preserveParams = false) => (
    dispatch: Dispatch,
) => {
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
    const unlocked = dispatch(onBeforePopState());
    if (!unlocked) return;

    const requestedRoute = findRouteByName(routeName);
    const isModal = requestedRoute && requestedRoute.isModal;

    const pathname = getRoute(routeName);
    const navigatorRoute = getActiveRoute(state);
    const currentApp = getAppWithParams(navigatorRoute.routeName);
    const nextApp = getAppWithParams(pathname);

    if (isModal) {
        // Application modals (Onboarding, FW Update, Backup, Select Device...)
        // display as a second child of root stack to be able get back to exact previous screen
        navigator.dispatch(
            StackActions.push({
                routeName: pathname,
                params: {
                    routeParams: params,
                },
            }),
        );
    } else if (currentApp.app !== nextApp.app) {
        // Application change (use case: "/wallet" > "/settings")
        // check if requested url has topLevelRoute route and dispatch second action if so
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

        // Navigation flow: reset root stack > navigate to requested route (base) > additionally navigate to nested route
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
        // TODO: Catch same url here
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

// external links
export const gotoUrl = (url: string) => {
    Linking.openURL(url);
};

export const androidBack = () => () => {
    const navigator = getNavigator();
    const state = getNavigatorState();
    if (navigator && isDrawerOpened(state)) {
        navigator.dispatch(NavigationActions.back());
    }
    return true; // always return true to block android behavior
};

export const back = () => (dispatch: Dispatch) => {
    const unlocked = dispatch(onBeforePopState());
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
    const { initialRun } = getState().suite;
    const unlocked = dispatch(onBeforePopState());
    if (initialRun && unlocked) {
        await dispatch(onLocationChange(getRoute('onboarding-index')));
    }
};
