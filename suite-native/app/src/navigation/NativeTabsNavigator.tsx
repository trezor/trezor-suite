import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type NativeSyntheticEvent } from 'react-native';
import { type PlatformIconIOS, type TabSelectedEvent, Tabs } from 'react-native-screens';

import {
    CommonActions,
    type DefaultNavigatorOptions,
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
import {
    type NativeStackHeaderItemButton,
    type NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { type AppTabsParamList, type RootStackParamList } from '@suite-native/navigation';
import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

type NativeTabIcon =
    | Extract<PlatformIconIOS, { type: 'templateSource' }>
    | Extract<NativeStackHeaderItemButton['icon'], { type: 'sfSymbol' }>;

const getHeaderIcon = (icon?: NativeTabIcon): NativeStackHeaderItemButton['icon'] => {
    if (icon?.type === 'templateSource') {
        return { type: 'image', source: icon.templateSource };
    }

    return icon;
};

export type NativeTabsOptions = {
    title?: string;
    icon?: NativeTabIcon;
    selectedIcon?: NativeTabIcon;
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
    const parentNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

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

    useLayoutEffect(() => {
        // UIKit keeps these controls on Duo's system control edge when rotating or folding.
        parentNavigation?.setOptions({
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerShadowVisible: false,
            headerTransparent: true,
            headerStyle: { backgroundColor: colors.surfaceFillPage },
            unstable_headerLeftItems: () =>
                state.routes.map(route => {
                    const { options } = descriptors[route.key]!;
                    const selected = route.key === focusedRouteKey;
                    const icon = selected ? options.selectedIcon : options.icon;

                    return {
                        type: 'button',
                        label: options.title ?? route.name,
                        accessibilityLabel: options.title ?? route.name,
                        identifier: `@tabBar/${route.name}`,
                        selected,
                        tintColor: selected ? colors.contentBrand : colors.contentPrimary,
                        icon: getHeaderIcon(icon),
                        onPress: () => {
                            const currentState = navigation.getState();
                            const currentRoute = currentState.routes.find(
                                item => item.key === route.key,
                            );

                            if (!currentRoute) return;

                            navigation.emit({ type: 'tabPress', target: currentRoute.key });

                            if (currentRoute.key !== currentState.routes[currentState.index]?.key) {
                                navigation.dispatch({
                                    ...CommonActions.navigate(
                                        currentRoute.name,
                                        currentRoute.params,
                                    ),
                                    target: currentState.key,
                                });
                            }
                        },
                    };
                }),
        });
    }, [
        colors.contentBrand,
        colors.contentPrimary,
        colors.surfaceFillPage,
        descriptors,
        focusedRouteKey,
        navigation,
        parentNavigation,
        state.routes,
    ]);

    useLayoutEffect(
        () => () => {
            parentNavigation?.setOptions({
                headerShown: false,
                headerTitle: undefined,
                headerBackVisible: undefined,
                headerShadowVisible: undefined,
                headerTransparent: undefined,
                headerStyle: undefined,
                unstable_headerLeftItems: undefined,
            });
        },
        [parentNavigation],
    );

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
                tabBarHidden
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
                            {isLoaded && render()}
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
