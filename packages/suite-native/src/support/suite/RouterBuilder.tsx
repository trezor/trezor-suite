import * as React from 'react';
import {
    NavigationContainer,
    createAppContainer,
    getActiveChildNavigationOptions,
    NavigationRouteConfigMap,
    NavigationScreenProp,
    NavigationComponent,
    // withNavigationFocus,
    // withOrientation, createKeyboardAwareNavigator
} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
// @ts-ignore
import createNativeStackNavigator from 'react-native-screens/createNativeStackNavigator';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createBottomTabNavigator } from 'react-navigation-tabs';

// eslint-disable-next-line @typescript-eslint/ban-types
type ScreenComponent = NavigationComponent<{}, {}> & {
    router?: any; // nested Navigator
};
// eslint-disable-next-line @typescript-eslint/ban-types
type ScreenConfigMap = NavigationRouteConfigMap<{}, {}>;

const useDrawer = (key: string, customViews: NavigatorViews, screen: ScreenComponent) => {
    const drawerKey = `_drawer_${key}`;
    const config: ScreenConfigMap = {};
    config[drawerKey] = {
        screen,
    };
    return createDrawerNavigator(config, {
        contentComponent: customViews.drawer,
    });
};

const useStack = (key: string, customViews: NavigatorViews, screen: ScreenComponent) => {
    // add prefix only for nested Navigators
    const stackKey = screen.router ? `_stack_${key}` : key;
    const config: ScreenConfigMap = {};
    config[stackKey] = {
        screen,
        navigationOptions: {
            // headerLeft: HeaderLeft,
            headerLeft: customViews.headerLeft,
        },
    };
    // return createNativeStackNavigator(config, {
    return createStackNavigator(config, {
        navigationOptions: ({ navigation, screenProps }) => ({
            ...getActiveChildNavigationOptions(navigation, screenProps),
        }),
    });
};

// Add static method "navigationOptions" to nested component
// this way it's possible to dynamically change Navigation settings (title, etc.) from view. See: @native/support/suite/Head
// Navigator.onNavigationStateChange > `ScreenComponent.navigationOptions()` will retrieve and apply settings
const withNavigationOptions = (Component: ScreenComponent) => {
    Component.navigationOptions = ({
        navigation,
    }: {
        navigation: NavigationScreenProp<any, any>;
    }) => {
        const { params } = navigation.state;
        if (params && params.navigationOptions) {
            return params.navigationOptions;
        }
        return undefined;
    };

    // TODO: withNavigationFocus
    return Component;
};

const useDrawerStack = (key: string, customViews: NavigatorViews, screen: ScreenComponent) =>
    useDrawer(key, customViews, useStack(key, customViews, screen));

const useTabs = (key: string, customViews: NavigatorViews, config: ScreenConfigMap) =>
    useDrawerStack(
        key,
        customViews,
        createBottomTabNavigator(config, {
            backBehavior: 'none', // 'history'
            tabBarComponent: customViews.tabs,

            // pass child Tab.navigationOptions received from by `withNavigationOptions` wrapper
            navigationOptions: ({ navigation, screenProps }) => ({
                headerMode: 'float',
                headerStyle: {
                    backgroundColor: '#f4511e',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                ...getActiveChildNavigationOptions(navigation, screenProps),
            }),
        }),
    );

type NavigatorViews = {
    drawer?: React.ComponentType<any>;
    headerLeft?: React.ComponentType<any>;
    tabs?: React.ComponentType<any>;
};

type Screen =
    | {
          key: string;
          type: 'default';
          screen: ScreenComponent;
      }
    | {
          key: string;
          type: 'drawer';
          screen: ScreenComponent;
          navigators: NavigatorViews;
      }
    | {
          key: string;
          type: 'tabs';
          tabs: Readonly<
              {
                  key: string;
                  screen: ScreenComponent;
              }[]
          >;
          navigators: NavigatorViews;
      };

export type Config = Readonly<Screen[]>;

/*
+-----------------------------------------------------------+
| Root (StackNavigator)                                     |
| +-------------------------------------------------------+ |
| | DrawerNavigator                                       | |
| | + --------------------------------------------------+ | |
| | | StackNavigator                                    | | |
| | | +-----------------------------------------------+ | | |
| | | | BottomTabNavigator                            | | | |
| | | | +-------------------------------------------+ | | | |
| | | | | withNavigationOptions(ContentComponent)   | | | | |
| | | | |                                           | | | | |
| | | | |                                           | | | | |
| | | | |                                           | | | | |
| | | | +-------------------------------------------+ | | | |
| | | +-----------------------------------------------+ | | |
| | +---------------------------------------------------+ | |
| +-------------------------------------------------------+ |
+ --------------------------------------------------------- +
*/

// 1. Root Navigator doesn't have any visible controls, it's responsible only for switching between applications
// 2. Drawer Navigator displays Drawer only
// 3. Stack Navigator displays Header only
// 4. BottomTab Navigator displays TabMenu only
// 5. withNavigationOptions passes "navigationOptions" to parent Navigators

export const create = (config: Config, initialRouteName: string): NavigationContainer => {
    const navigationConfig: ScreenConfigMap = {};
    config.forEach(app => {
        if (app.type === 'drawer') {
            // Drawer > Stack
            navigationConfig[app.key] = {
                screen: useDrawerStack(app.key, app.navigators, withNavigationOptions(app.screen)),
            };
        } else if (app.type === 'tabs') {
            // Drawer > Stack > Tabs
            const tabConfig: ScreenConfigMap = {};
            app.tabs.forEach(tab => {
                tabConfig[tab.key] = withNavigationOptions(tab.screen);
            });
            navigationConfig[app.key] = {
                screen: useTabs(app.key, app.navigators, tabConfig),
            };
        } else {
            // default without any navigator
            navigationConfig[app.key] = {
                screen: app.screen,
            };
        }
    });

    return createAppContainer(
        createNativeStackNavigator(navigationConfig, {
            // createStackNavigator(navigationConfig, {
            headerMode: 'none',
            initialRouteName,
        }),
    );
};
