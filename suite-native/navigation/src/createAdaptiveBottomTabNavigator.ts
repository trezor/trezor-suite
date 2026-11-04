import {
    type BottomTabNavigationEventMap,
    type BottomTabNavigationOptions,
    type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import {
    type NavigatorTypeBagBase,
    type ParamListBase,
    type StaticConfig,
    type TabNavigationState,
    type TypedNavigator,
    createNavigatorFactory,
} from '@react-navigation/native';

import { AdaptiveBottomTabNavigator } from './components/AdaptiveBottomTabNavigator/AdaptiveBottomTabNavigator';

type AdaptiveBottomTabTypeBag<
    ParamList extends ParamListBase,
    NavigatorID extends string | undefined,
> = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: BottomTabNavigationOptions;
    EventMap: BottomTabNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof AdaptiveBottomTabNavigator;
};

/**
 * Uses the existing bottom-tab view by default and platform system tabs when enabled.
 * SwiftUI reports selection changes only: selected-tab presses and native transition
 * completion events are unavailable. Native scenes stay mounted after their first visit.
 * Native tabs use system labels/icons; SwiftUI 58 on iOS 18+ ignores custom bar-item
 * identifiers and accessibility modifiers, exposing the system tab accessibility instead.
 */
export function createAdaptiveBottomTabNavigator<
    const ParamList extends ParamListBase,
    const NavigatorID extends string | undefined = string | undefined,
    const TypeBag extends NavigatorTypeBagBase = AdaptiveBottomTabTypeBag<ParamList, NavigatorID>,
>(config?: undefined): TypedNavigator<TypeBag, undefined>;
export function createAdaptiveBottomTabNavigator<
    const ParamList extends ParamListBase,
    const NavigatorID extends string | undefined = string | undefined,
    const TypeBag extends NavigatorTypeBagBase = AdaptiveBottomTabTypeBag<ParamList, NavigatorID>,
    const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config: Config): TypedNavigator<TypeBag, Config>;
export function createAdaptiveBottomTabNavigator(config?: unknown) {
    return createNavigatorFactory(AdaptiveBottomTabNavigator)(config);
}
