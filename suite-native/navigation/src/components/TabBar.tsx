import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';
import { selectIsPortfolioEmpty, selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { TabBarItem } from './TabBarItem';
import { TabsOptions } from '../types';

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
    borderTopColor: utils.colors.borderOnElevation0,
    borderTopWidth: utils.borders.widths.s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: Math.max(insetLeft, 20),
    paddingRight: Math.max(insetRight, 20),
    paddingBottom: insetsBottom,
}));

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();
    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);

    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);

    const isConnectedDevice = isUsbDeviceConnectFeatureEnabled && !isDeviceImported;

    if (isPortfolioEmpty && !isConnectedDevice) return null;

    return (
        <Box
            style={applyStyle(tabBarStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetsBottom: insets.bottom,
            })}
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { routeName, iconName, label, params } = tabItemOptions[route.name];

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
                        title={label}
                        onPress={handleTabBarItemPress}
                    />
                );
            })}
        </Box>
    );
};
