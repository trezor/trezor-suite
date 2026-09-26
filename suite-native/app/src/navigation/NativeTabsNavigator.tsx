import { useEffect, useRef, useState } from 'react';
import { type NativeSyntheticEvent } from 'react-native';
import { type PlatformIconIOS, type TabSelectedEvent, Tabs } from 'react-native-screens';

import {
    CommonActions,
    type DefaultNavigatorOptions,
    NavigationMetaContext,
    type NavigationProp,
    type ParamListBase,
    StackActions,
    type TabActionHelpers,
    type TabNavigationState,
    TabRouter,
    type TabRouterOptions,
    type TypedNavigator,
    createNavigatorFactory,
    useNavigationBuilder,
} from '@react-navigation/native';

import { type AppTabsParamList } from '@suite-native/navigation';
import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

const nativeTabsMeta = { type: 'native-tabs' };

export type NativeTabsOptions = {
    title?: string;
    icon?: PlatformIconIOS;
    selectedIcon?: PlatformIconIOS;
    popToTopOnBlur?: boolean;
};

type NativeTabsEventMap = {
    tabPress: { data: undefined; canPreventDefault: false };
};

type NativeTabsNavigationProp<RouteName extends keyof AppTabsParamList = keyof AppTabsParamList> =
    NavigationProp<
        AppTabsParamList,
        RouteName,
        undefined,
        TabNavigationState<AppTabsParamList>,
        NativeTabsOptions,
        NativeTabsEventMap
    > &
        TabActionHelpers<AppTabsParamList>;

type NativeTabsNavigatorProps = DefaultNavigatorOptions<
    ParamListBase,
    undefined,
    TabNavigationState<ParamListBase>,
    NativeTabsOptions,
    NativeTabsEventMap,
    NavigationProp<
        ParamListBase,
        string,
        undefined,
        TabNavigationState<ParamListBase>,
        NativeTabsOptions,
        NativeTabsEventMap
    > &
        TabActionHelpers<ParamListBase>
> &
    TabRouterOptions;

const NativeTabsNavigator = (props: NativeTabsNavigatorProps) => {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
        TabNavigationState<ParamListBase>,
        TabRouterOptions,
        TabActionHelpers<ParamListBase>,
        NativeTabsOptions,
        NativeTabsEventMap
    >(TabRouter, props);
    const {
        utils: { colors },
    } = useNativeStyles();
    const focusedRouteKey = state.routes[state.index]!.key;
    const [loadedRouteKeys, setLoadedRouteKeys] = useState([focusedRouteKey]);
    const [nativeProvenance, setNativeProvenance] = useState(0);
    const latestNativeProvenance = useRef(0);
    const previousRouteKey = useRef(focusedRouteKey);

    if (!loadedRouteKeys.includes(focusedRouteKey)) {
        setLoadedRouteKeys([...loadedRouteKeys, focusedRouteKey]);
    }

    useEffect(() => {
        const previousKey = previousRouteKey.current;

        if (previousKey !== focusedRouteKey && descriptors[previousKey]?.options.popToTopOnBlur) {
            const previousRoute = state.routes.find(route => route.key === previousKey);

            if (previousRoute?.state?.type === 'stack' && previousRoute.state.key) {
                navigation.dispatch({
                    ...StackActions.popToTop(),
                    target: previousRoute.state.key,
                });
            }
        }

        previousRouteKey.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, navigation, state.routes]);

    const handleTabSelected = ({ nativeEvent }: NativeSyntheticEvent<TabSelectedEvent>) => {
        if (nativeEvent.provenance < latestNativeProvenance.current) return;

        latestNativeProvenance.current = nativeEvent.provenance;
        setNativeProvenance(nativeEvent.provenance);

        const currentState = navigation.getState();
        const route = currentState.routes.find(item => item.key === nativeEvent.selectedScreenKey);

        if (!route) return;

        if (nativeEvent.actionOrigin === 'user') {
            navigation.emit({ type: 'tabPress', target: route.key });
        }

        if (route.key !== currentState.routes[currentState.index]?.key) {
            navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: currentState.key,
            });
        }
    };

    return (
        <NavigationContent>
            <Tabs.Host
                navStateRequest={{
                    selectedScreenKey: focusedRouteKey,
                    baseProvenance: nativeProvenance,
                }}
                onTabSelected={handleTabSelected}
                colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                nativeContainerStyle={{ backgroundColor: colors.surfaceFillPage }}
                ios={{ tabBarControllerMode: 'tabBar', tabBarTintColor: colors.contentBrand }}
            >
                {state.routes.map(route => {
                    const { options, render } = descriptors[route.key]!;
                    const title = options.title ?? route.name;
                    const isLoaded =
                        loadedRouteKeys.includes(route.key) ||
                        state.preloadedRouteKeys.includes(route.key);

                    return (
                        <Tabs.Screen
                            key={route.key}
                            screenKey={route.key}
                            title={title}
                            tabBarItemTestID={`@tabBar/${route.name}`}
                            tabBarItemAccessibilityLabel={title}
                            ios={{ icon: options.icon, selectedIcon: options.selectedIcon }}
                        >
                            {isLoaded && (
                                <NavigationMetaContext.Provider value={nativeTabsMeta}>
                                    {render()}
                                </NavigationMetaContext.Provider>
                            )}
                        </Tabs.Screen>
                    );
                })}
            </Tabs.Host>
        </NavigationContent>
    );
};

type NativeTabsTypeBag = {
    ParamList: AppTabsParamList;
    NavigatorID: undefined;
    State: TabNavigationState<AppTabsParamList>;
    ScreenOptions: NativeTabsOptions;
    EventMap: NativeTabsEventMap;
    NavigationList: {
        [RouteName in keyof AppTabsParamList]: NativeTabsNavigationProp<RouteName>;
    };
    Navigator: typeof NativeTabsNavigator;
};

export const createNativeTabsNavigator = (): TypedNavigator<NativeTabsTypeBag> =>
    createNavigatorFactory(NativeTabsNavigator)();
