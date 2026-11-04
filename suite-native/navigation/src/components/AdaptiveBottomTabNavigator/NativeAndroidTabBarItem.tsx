import { NavigationBarItem, Text } from '@expo/ui/jetpack-compose';
import { semantics, testID } from '@expo/ui/jetpack-compose/modifiers';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { type Route } from '@react-navigation/native';

import { MOBILE_ICON_FONT_NAME } from '@suite-common/icons';
import { icons } from '@suite-native/icons';

import { selectNativeTab } from './nativeTabSelection';
import { useNativeTabOptions } from './useNativeTabOptions';
import { type TabsOptions } from '../../types';

type NativeAndroidTabBarItemProps = {
    route: Route<string>;
    isFocused: boolean;
    state: BottomTabBarProps['state'];
    navigation: BottomTabBarProps['navigation'];
    options: BottomTabBarProps['descriptors'][string]['options'];
    tabItemOptions: TabsOptions;
};

export const NativeAndroidTabBarItem = ({
    route,
    isFocused,
    state,
    navigation,
    options,
    tabItemOptions,
}: NativeAndroidTabBarItemProps) => {
    const {
        label,
        accessibilityLabel,
        testID: itemTestID,
        tabOption,
    } = useNativeTabOptions({
        route,
        options,
        tabItemOptions,
    });
    const iconName = isFocused ? tabOption?.focusedIconName : tabOption?.iconName;

    return (
        <NavigationBarItem
            selected={isFocused}
            onClick={() =>
                selectNativeTab({ routeKey: route.key, state, navigation, tabItemOptions })
            }
            modifiers={[testID(itemTestID), semantics({ contentDescription: accessibilityLabel })]}
        >
            <NavigationBarItem.Icon>
                {/* Expo UI 58 ignores SelectedIcon, so choose the glyph in the regular Icon slot. */}
                <Text style={{ fontFamily: MOBILE_ICON_FONT_NAME, fontSize: 24 }}>
                    {iconName ? String.fromCodePoint(icons[iconName]) : ''}
                </Text>
            </NavigationBarItem.Icon>
            <NavigationBarItem.Label>
                <Text modifiers={[testID(`${itemTestID}/title`)]}>{label}</Text>
            </NavigationBarItem.Label>
        </NavigationBarItem>
    );
};
