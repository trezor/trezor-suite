import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { type Route } from '@react-navigation/native';

import { useTranslate } from '@suite-native/intl';

import { tabBarLabelTxKeys, tabBarSystemImages } from '../../tabBarConfig';
import { type TabsOptions } from '../../types';

type UseNativeTabOptionsParams = {
    route: Route<string>;
    options: BottomTabBarProps['descriptors'][string]['options'];
    tabItemOptions: TabsOptions;
};

export const useNativeTabOptions = ({
    route,
    options,
    tabItemOptions,
}: UseNativeTabOptionsParams) => {
    const { translate } = useTranslate();
    const tabOption = tabItemOptions[route.name];
    const label =
        typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ??
              (tabOption ? translate(tabBarLabelTxKeys[tabOption.routeName]) : route.name));

    return {
        label,
        accessibilityLabel: options.tabBarAccessibilityLabel ?? label,
        testID: options.tabBarButtonTestID ?? `@tabBar/${route.name}`,
        systemImage: tabOption ? tabBarSystemImages[tabOption.routeName] : undefined,
        tabOption,
    };
};
