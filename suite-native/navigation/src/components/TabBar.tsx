import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Box } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AppTabsRoutes } from '../routes';
import { type TabsOptions } from '../types';
import { TabBarItem } from './TabBarItem';
interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOptions;
}

const tabBarStyle = prepareNativeStyle<{
    insetLeft: number;
    insetRight: number;
    insetsBottom: number;
}>((utils, { insetLeft, insetRight, insetsBottom }) => ({
    width: '100%',
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopColor: utils.colors.borderElevation0,
    borderTopWidth: utils.borders.widths.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: Math.max(insetLeft, 20),
    paddingRight: Math.max(insetRight, 20),
    paddingBottom: insetsBottom,
}));

const TabBarLabelTxKeys = {
    [AppTabsRoutes.HomeStack]: 'navigation.tabs.home',
    [AppTabsRoutes.AccountsStack]: 'navigation.tabs.accounts',
    [AppTabsRoutes.TradeStack]: 'navigation.tabs.trade',
    [AppTabsRoutes.EarnStack]: 'navigation.tabs.earn',
    [AppTabsRoutes.Settings]: 'navigation.tabs.settings',
} as const satisfies Record<AppTabsRoutes, TxKeyPath>;

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isEarnEnabled = useFeatureFlag(FeatureFlag.IsEarnEnabled);

    const shouldHideEarnTab = isBitcoinOnlyFirmware || !isEarnEnabled;

    return (
        <Box
            style={applyStyle(tabBarStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetsBottom: insets.bottom,
            })}
        >
            {state.routes.map((route, index) => {
                if (route.name === AppTabsRoutes.EarnStack && shouldHideEarnTab) {
                    return null;
                }

                const isFocused = state.index === index;
                const { routeName, iconName, focusedIconName, params } = tabItemOptions[route.name];
                const tabBarLabelTxKey = TabBarLabelTxKeys[routeName];

                const handleTabBarItemPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(routeName, { ...params });
                    }
                };

                return (
                    <TabBarItem
                        key={route.key}
                        isFocused={isFocused}
                        iconName={iconName}
                        focusedIconName={focusedIconName}
                        title={translate(tabBarLabelTxKey)}
                        onPress={handleTabBarItemPress}
                        testID={route.name}
                    />
                );
            })}
        </Box>
    );
};
