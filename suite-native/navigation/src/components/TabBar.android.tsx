import { View } from 'react-native';

import AccountsIcon from '@expo/material-symbols/account_balance_wallet.xml';
import HomeIcon from '@expo/material-symbols/home.xml';
import EarnIcon from '@expo/material-symbols/savings.xml';
import SettingsIcon from '@expo/material-symbols/settings.xml';
import TradeIcon from '@expo/material-symbols/swap_horiz.xml';
import { Host, Icon, NavigationBar, NavigationBarItem, Text } from '@expo/ui/jetpack-compose';

import { isDarkColor, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AppTabsRoutes } from '../routes';
import { type TabBarProps, useTabBarItems } from './useTabBarItems';

const tabBarStyle = prepareNativeStyle(utils => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillPage,
}));

const tabIcons = {
    [AppTabsRoutes.HomeStack]: HomeIcon,
    [AppTabsRoutes.AccountsStack]: AccountsIcon,
    [AppTabsRoutes.TradeStack]: TradeIcon,
    [AppTabsRoutes.EarnStack]: EarnIcon,
    [AppTabsRoutes.Settings]: SettingsIcon,
} as const satisfies Record<AppTabsRoutes, number>;

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
                                <Icon source={tabIcons[item.routeName]} size={24} />
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
