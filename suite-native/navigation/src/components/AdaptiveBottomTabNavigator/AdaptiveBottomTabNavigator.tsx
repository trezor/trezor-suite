import {
    type BottomTabNavigationEventMap,
    type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import {
    type ParamListBase,
    type TabActionHelpers,
    type TabNavigationState,
    TabRouter,
    type TabRouterOptions,
    useNavigationBuilder,
} from '@react-navigation/native';

import { AdaptiveBottomTabView } from './AdaptiveBottomTabView';
import { type AdaptiveBottomTabNavigatorProps } from './types';

export const AdaptiveBottomTabNavigator = ({
    id,
    initialRouteName,
    backBehavior,
    UNSTABLE_routeNamesChangeBehavior,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
    ...rest
}: AdaptiveBottomTabNavigatorProps) => {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
        TabNavigationState<ParamListBase>,
        TabRouterOptions,
        TabActionHelpers<ParamListBase>,
        BottomTabNavigationOptions,
        BottomTabNavigationEventMap
    >(TabRouter, {
        id,
        initialRouteName,
        backBehavior,
        UNSTABLE_routeNamesChangeBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });

    return (
        <NavigationContent>
            <AdaptiveBottomTabView
                {...rest}
                state={state}
                navigation={navigation}
                descriptors={descriptors}
            />
        </NavigationContent>
    );
};
