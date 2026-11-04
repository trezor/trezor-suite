import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ViewInstance } from 'react-native';

import { Host, TabView } from '@expo/ui/swift-ui';
import { onGeometryChange, tabViewStyle } from '@expo/ui/swift-ui/modifiers';
import { StackActions, useTheme } from '@react-navigation/native';

import { NativeIOSTab } from './NativeIOSTab';
import { selectNativeTab } from './nativeTabSelection';
import { type AdaptiveBottomTabViewProps } from './types';

const styles = StyleSheet.create({ fill: { flex: 1 } });

type NativeIOSTabViewProps = Omit<AdaptiveBottomTabViewProps, 'isNativeNavigationEnabled'>;

export const NativeIOSTabView = ({
    state,
    navigation,
    descriptors,
    tabItemOptions,
}: NativeIOSTabViewProps) => {
    // TabRouter keeps its index on a registered route.
    const focusedRouteKey = state.routes[state.index]!.key;
    const [loadedRouteKeys, setLoadedRouteKeys] = useState([focusedRouteKey]);
    const [viewportBottom, setViewportBottom] = useState<number>();
    const viewportRef = useRef<ViewInstance>(null);
    const previousRouteKeyRef = useRef(focusedRouteKey);
    const { dark } = useTheme();

    const pendingRouteKeys = [focusedRouteKey, ...state.preloadedRouteKeys].filter(
        key => !loadedRouteKeys.includes(key),
    );
    if (pendingRouteKeys.length > 0) {
        setLoadedRouteKeys([...loadedRouteKeys, ...pendingRouteKeys]);
    }

    useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        previousRouteKeyRef.current = focusedRouteKey;

        if (
            previousRouteKey === focusedRouteKey ||
            !descriptors[previousRouteKey]?.options.popToTopOnBlur
        ) {
            return;
        }

        const latestState = navigation.getState();
        const previousRoute = latestState.routes.find(route => route.key === previousRouteKey);
        if (
            latestState.routes[latestState.index]?.key === focusedRouteKey &&
            previousRoute?.state?.type === 'stack' &&
            previousRoute.state.key
        ) {
            // TabView has no transition-completion callback; reset the blurred stack on selection.
            navigation.dispatch({ ...StackActions.popToTop(), target: previousRoute.state.key });
        }
    }, [descriptors, focusedRouteKey, navigation]);

    const measureViewport = () => {
        viewportRef.current?.measureInWindow((_x, y, _width, height) =>
            setViewportBottom(y + height),
        );
    };

    return (
        <View ref={viewportRef} collapsable={false} style={styles.fill} onLayout={measureViewport}>
            <Host
                style={styles.fill}
                colorScheme={dark ? 'dark' : 'light'}
                ignoreSafeArea="keyboard"
                modifiers={[onGeometryChange(measureViewport)]}
            >
                <TabView
                    selection={focusedRouteKey}
                    onSelectionChange={routeKey => {
                        if (routeKey !== focusedRouteKey) {
                            selectNativeTab({ routeKey, state, navigation, tabItemOptions });
                        }
                    }}
                    modifiers={[tabViewStyle({ type: 'automatic' })]}
                >
                    {state.routes.flatMap((route, index) => {
                        const descriptor = descriptors[route.key];
                        if (!descriptor) return [];

                        return [
                            <NativeIOSTab
                                key={route.key}
                                route={route}
                                descriptor={descriptor}
                                isFocused={state.index === index}
                                isLoaded={
                                    loadedRouteKeys.includes(route.key) ||
                                    route.key === focusedRouteKey ||
                                    state.preloadedRouteKeys.includes(route.key)
                                }
                                viewportBottom={viewportBottom}
                                tabItemOptions={tabItemOptions}
                            />,
                        ];
                    })}
                </TabView>
            </Host>
        </View>
    );
};
