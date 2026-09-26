import { View } from 'react-native';

import { Host, NavigationBar, NavigationBarItem, Text } from '@expo/ui/jetpack-compose';

import { MOBILE_ICON_FONT_NAME, icons } from '@suite-native/icons';
import { isDarkColor, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type TabBarProps, useTabBarItems } from './useTabBarItems';

const tabBarStyle = prepareNativeStyle(utils => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillPage,
}));

export const TabBar = (props: TabBarProps) => {
    const items = useTabBarItems(props);
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const colorScheme = isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light';

    return (
        <View style={applyStyle(tabBarStyle)} testID="@tabBar">
            <Host
                colorScheme={colorScheme}
                seedColor={colors.contentBrand}
                matchContents={{ vertical: true }}
                style={{ width: '100%' }}
            >
                <NavigationBar containerColor={colors.surfaceFillPage} tonalElevation={0}>
                    {items.map(item => (
                        <NavigationBarItem
                            key={item.key}
                            selected={item.isFocused}
                            onClick={item.onPress}
                            colors={{
                                selectedIconColor: colors.contentBrand,
                                selectedTextColor: colors.contentBrand,
                                selectedIndicatorColor: colors.surfaceFillModelessBrand,
                                unselectedIconColor: colors.contentNeutral,
                                unselectedTextColor: colors.contentNeutral,
                            }}
                        >
                            <NavigationBarItem.Icon>
                                <Text
                                    color={
                                        item.isFocused ? colors.contentBrand : colors.contentNeutral
                                    }
                                    style={{
                                        fontFamily: MOBILE_ICON_FONT_NAME,
                                        fontSize: 24,
                                        lineHeight: 24,
                                    }}
                                    maxLines={1}
                                >
                                    {String.fromCodePoint(
                                        icons[
                                            item.isFocused ? item.focusedIconName : item.iconName
                                        ],
                                    )}
                                </Text>
                            </NavigationBarItem.Icon>
                            <NavigationBarItem.Label>
                                <Text>{item.title}</Text>
                            </NavigationBarItem.Label>
                        </NavigationBarItem>
                    ))}
                </NavigationBar>
            </Host>
        </View>
    );
};
