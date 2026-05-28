import { type ReactNode, createContext, useMemo, useRef, useState } from 'react';

import {
    DarkTheme,
    DefaultTheme,
    NavigationContainer,
    type NavigationContainerRefWithCurrent,
    type NavigationState,
    type PartialState,
    type Route,
    ThemeProvider,
    createNavigationContainerRef,
} from '@react-navigation/native';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { addSentryBreadcrumb, setSentryTag } from '@suite-native/sentry';
import { useNativeStyles } from '@trezor/styles-native';

import { useReportSendFlowExitToAnalytics } from '../hooks/useReportSendFlowExitToAnalytics';
import { type RootStackParamList } from '../navigators';

export const IsNavigationReadyContext = createContext(false);

const fallbackNavigationContainerRef = createNavigationContainerRef<RootStackParamList>();
let activeNavigationContainerRef: NavigationContainerRefWithCurrent<RootStackParamList> =
    fallbackNavigationContainerRef;

type NavigationRoute = Route<string> & {
    state?: NavigationState | PartialState<NavigationState>;
};

type NavigationStateLike = NavigationState | PartialState<NavigationState>;

const EXPO_ROUTER_ROOT_ROUTE_NAME = '__root';

const getActiveNavigationContainerRef = () => activeNavigationContainerRef;

const getUntypedActiveNavigationContainerRef = () =>
    getActiveNavigationContainerRef() as unknown as {
        navigate: (routeName: string, params?: object) => void;
        reset: (state: object) => void;
    };

const getRouteState = (route?: NavigationRoute) => route?.state;

const isExpoRouterRootState = (state: NavigationStateLike): boolean =>
    state.routeNames?.includes(EXPO_ROUTER_ROOT_ROUTE_NAME) === true &&
    state.routes.some(route => route.name === EXPO_ROUTER_ROOT_ROUTE_NAME);

const unwrapExpoRouterRootState = (state: NavigationStateLike): NavigationStateLike => {
    if (!isExpoRouterRootState(state)) return state;

    const activeRoute = state.routes[state.index ?? 0] as NavigationRoute | undefined;
    const nestedState =
        activeRoute?.name === EXPO_ROUTER_ROOT_ROUTE_NAME
            ? getRouteState(activeRoute)
            : getRouteState(
                  state.routes.find(route => route.name === EXPO_ROUTER_ROOT_ROUTE_NAME) as
                      | NavigationRoute
                      | undefined,
              );

    return nestedState ?? state;
};

const getRawNavigationState = () => {
    const activeRef = getActiveNavigationContainerRef();

    return activeRef.getRootState() ?? activeRef.getState();
};

const getNavigationState = () => unwrapExpoRouterRootState(getRawNavigationState());

const getCurrentRouteFromState = (state: NavigationStateLike): NavigationRoute | undefined => {
    const route = state.routes[state.index ?? 0] as NavigationRoute | undefined;
    const routeState = getRouteState(route);

    return routeState ? getCurrentRouteFromState(routeState) : route;
};

const getCurrentRoute = () => getCurrentRouteFromState(getNavigationState());

const shouldWrapActionForExpoRouter = () => isExpoRouterRootState(getRawNavigationState());

// Keep one stable exported object while letting Expo Router provide the actual root ref.
export const navigationContainerRef = new Proxy(fallbackNavigationContainerRef, {
    get: (_target, property) => {
        const activeRef = getActiveNavigationContainerRef() as unknown as Record<
            PropertyKey,
            unknown
        >;

        if (property === 'getState' || property === 'getRootState') {
            return getNavigationState;
        }

        if (property === 'getCurrentRoute') {
            return getCurrentRoute;
        }

        if (property === 'navigate') {
            return (routeName: string, params?: object) => {
                if (shouldWrapActionForExpoRouter()) {
                    return getUntypedActiveNavigationContainerRef().navigate(
                        EXPO_ROUTER_ROOT_ROUTE_NAME,
                        {
                            screen: routeName,
                            params,
                        },
                    );
                }

                return getUntypedActiveNavigationContainerRef().navigate(routeName, params);
            };
        }

        if (property === 'reset') {
            return (state: NavigationStateLike) => {
                if (shouldWrapActionForExpoRouter()) {
                    return getUntypedActiveNavigationContainerRef().reset({
                        index: 0,
                        routes: [
                            {
                                name: EXPO_ROUTER_ROOT_ROUTE_NAME,
                                state,
                            },
                        ],
                    });
                }

                return getUntypedActiveNavigationContainerRef().reset(state);
            };
        }

        const value = activeRef[property];

        if (typeof value === 'function') {
            return value.bind(activeRef);
        }

        return value;
    },
    set: (_target, property, value) => {
        const activeRef = getActiveNavigationContainerRef() as unknown as Record<
            PropertyKey,
            unknown
        >;
        activeRef[property] = value;

        return true;
    },
}) as NavigationContainerRefWithCurrent<RootStackParamList>;

export const bindNavigationContainerRef = (
    navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
) => {
    const typedNavigationRef =
        navigationRef as unknown as NavigationContainerRefWithCurrent<RootStackParamList>;

    activeNavigationContainerRef = typedNavigationRef;

    return () => {
        if (activeNavigationContainerRef === typedNavigationRef) {
            activeNavigationContainerRef = fallbackNavigationContainerRef;
        }
    };
};

export const useNavigationDevTools = ({
    ref,
}: {
    ref: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
}) => {
    useReactNavigationDevTools({ ref });
};

const useNavigationTheme = () => {
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    return useMemo(() => {
        // Setting theme colors to match the background color of the screen prevents white flash on screen change in dark mode.
        const isDarkTheme = isDarkColor(colors.surfaceFillPage);
        if (isDarkTheme) {
            return {
                ...DarkTheme,
                colors: {
                    ...DarkTheme.colors,
                    background: colors.surfaceFillPage,
                },
            };
        }

        return {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: colors.surfaceFillPage,
            },
        };
    }, [colors, isDarkColor]);
};

export const NavigationThemeProvider = ({ children }: { children: ReactNode }) => {
    const themeColors = useNavigationTheme();

    return <ThemeProvider value={themeColors}>{children}</ThemeProvider>;
};

export const NavigationContainerWithAnalytics = ({ children }: { children: ReactNode }) => {
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const routeNameRef = useRef<string | undefined>(undefined);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const reportSendFlowExitToAnalytics = useReportSendFlowExitToAnalytics();

    // Enable React Navigation DevTools in development
    useNavigationDevTools({ ref: fallbackNavigationContainerRef });

    const themeColors = useNavigationTheme();

    const handleNavigationReady = () => {
        routeNameRef.current = fallbackNavigationContainerRef.getCurrentRoute()?.name;
        if (!isNavigationReady) setIsNavigationReady(true);
    };

    const handleStateChange = () => {
        if (!fallbackNavigationContainerRef.isReady()) return;

        const previousRouteName = routeNameRef.current;
        const currentRouteName = fallbackNavigationContainerRef.getCurrentRoute()?.name;

        // If the user abandons the send flow, this function reports from which step.
        reportSendFlowExitToAnalytics(currentRouteName);

        if (previousRouteName !== currentRouteName) {
            // Save the current route name for later comparison
            routeNameRef.current = currentRouteName;

            if (!currentRouteName || !previousRouteName) return;

            analytics.report({
                type: events.screenChangeEvent.name,
                payload: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            addSentryBreadcrumb({
                category: events.screenChangeEvent.name,
                message: 'screen changed',
                level: 'info',
                data: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            setSentryTag('route', currentRouteName);
        }
    };

    return (
        <IsNavigationReadyContext.Provider value={isNavigationReady}>
            <NavigationContainer
                ref={fallbackNavigationContainerRef}
                onReady={handleNavigationReady}
                onStateChange={handleStateChange}
                theme={themeColors}
            >
                {children}
            </NavigationContainer>
        </IsNavigationReadyContext.Provider>
    );
};
