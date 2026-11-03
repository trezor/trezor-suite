import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
    CommonActions,
    type EventArg,
    type ParamListBase,
    type TabNavigationState,
} from '@react-navigation/native';

import { type TabsOptions } from '../../types';

type NativeTabPress = {
    type: 'tabPress';
    target: string;
    canPreventDefault: true;
};

export type NativeTabNavigation = Pick<BottomTabBarProps['navigation'], 'getState' | 'dispatch'> & {
    emit: (event: NativeTabPress) => EventArg<'tabPress', true>;
};

type SelectNativeTabParams = {
    routeKey: string;
    state: TabNavigationState<ParamListBase>;
    navigation: NativeTabNavigation;
    tabItemOptions: TabsOptions;
};

export const selectNativeTab = ({
    routeKey,
    state,
    navigation,
    tabItemOptions,
}: SelectNativeTabParams): boolean => {
    const renderedRoute = state.routes.find(route => route.key === routeKey);
    const currentState = navigation.getState();
    const currentRoute = currentState.routes.find(route => route.key === routeKey);
    const focusedRouteKey = currentState.routes[currentState.index]?.key;

    if (
        currentState.key !== state.key ||
        !renderedRoute ||
        renderedRoute.name !== currentRoute?.name ||
        focusedRouteKey !== state.routes[state.index]?.key
    ) {
        return false;
    }

    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });

    // A tabPress listener may prevent, redirect, or unregister this route synchronously.
    const latestState = navigation.getState();
    const latestRoute = latestState.routes.find(route => route.key === routeKey);
    if (
        event.defaultPrevented ||
        latestState.key !== currentState.key ||
        latestRoute?.name !== currentRoute.name ||
        latestState.routes[latestState.index]?.key !== focusedRouteKey ||
        latestState.routes[latestState.index]?.key === routeKey
    ) {
        return false;
    }

    navigation.dispatch({
        ...CommonActions.navigate(latestRoute.name, {
            ...tabItemOptions[latestRoute.name]?.params,
        }),
        target: latestState.key,
    });

    return true;
};
