import { useState } from 'react';
import { View } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Meta, StoryObj } from '@storybook/react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TabBar as TabBarComponent } from '../../components/TabBar';
import { AppTabsRoutes } from '../../routes';
import { type TabsOptions } from '../../types';

// The TabsOptions can not be reused, because it would cause circular dependency (it is defined in the `app` package).
// Since this is only a UI demo, it is not a big deal to define it here locally.
const tabItemOptions: TabsOptions = {
    [AppTabsRoutes.HomeStack]: {
        routeName: AppTabsRoutes.HomeStack,
        iconName: 'house',
        focusedIconName: 'houseFilled',
    },
    [AppTabsRoutes.AccountsStack]: {
        routeName: AppTabsRoutes.AccountsStack,
        iconName: 'discover',
        focusedIconName: 'discoverFilled',
    },
    [AppTabsRoutes.TradeStack]: {
        routeName: AppTabsRoutes.TradeStack,
        iconName: 'repeat',
        focusedIconName: 'repeat',
    },
    [AppTabsRoutes.EarnStack]: {
        routeName: AppTabsRoutes.EarnStack,
        iconName: 'piggyBank',
        focusedIconName: 'piggyBankFilled',
    },
    [AppTabsRoutes.Settings]: {
        routeName: AppTabsRoutes.Settings,
        iconName: 'gear',
        focusedIconName: 'gearFilled',
    },
};

// The tab bar floats at the bottom of its parent, so it needs a container with some height.
const storyContainerStyle = prepareNativeStyle(() => ({
    height: 120,
}));

const routes = Object.keys(tabItemOptions).map(name => ({ key: name, name }));

const InteractiveTabBar = () => {
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const { applyStyle } = useNativeStyles();

    const props = {
        state: { index: selectedTabIndex, routes },
        navigation: {
            emit: () => ({ defaultPrevented: false }),
            navigate: (routeName: string) => {
                const nextIndex = routes.findIndex(route => route.name === routeName);
                if (nextIndex !== -1) {
                    setSelectedTabIndex(nextIndex);
                }
            },
        },
    } as unknown as BottomTabBarProps;

    return (
        <View style={applyStyle(storyContainerStyle)}>
            <TabBarComponent {...props} tabItemOptions={tabItemOptions} />
        </View>
    );
};

const meta: Meta<typeof TabBarComponent> = {
    title: 'Navigation/Tabs',
    component: TabBarComponent,
    argTypes: {
        tabItemOptions: { table: { disable: true } },
        state: { table: { disable: true } },
        navigation: { table: { disable: true } },
    },
};

export default meta;

export const TabBar: StoryObj<typeof TabBarComponent> = {
    name: 'TabBar',
    parameters: {
        layout: { disablePaddingHorizontal: true },
    },
    render: () => <InteractiveTabBar />,
};
