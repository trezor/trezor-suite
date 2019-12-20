import React, { useEffect, useState } from 'react';
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
import createNativeStackNavigator from 'react-native-screens/createNativeStackNavigator.js'; // eslint-disable-line import/extensions
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createBottomTabNavigator } from 'react-navigation-tabs';

import TabsBar from '@suite-components/Tabs';
import Drawer from '@suite-components/Drawer';
import HeaderLeft from '@suite-components/Header';

type ScreenComponent = NavigationComponent<{}, {}>;
type ScreenConfigMap = NavigationRouteConfigMap<{}, {}>;

const useDrawer = (key: string, screen: ScreenComponent) => {
    const config: ScreenConfigMap = {};
    config[`_drawer_${key}`] = {
        // config[key] = {
        screen,
    };
    return createDrawerNavigator(config, {
        contentComponent: Drawer,
        // statusBarAnimation: 'slide',
        // hideStatusBar: true,
        // navigationOptions: {
        //     headerStyle: {
        //         backgroundColor: '#f4511e',
        //     },
        // },
    });
};

const useStack = (key: string, screen: ScreenComponent) => {
    const config: ScreenConfigMap = {};
    config[`_stack_${key}`] = {
        // config[key] = {
        screen,
        navigationOptions: {
            headerLeft: HeaderLeft,
        },
    };
    // return createNativeStackNavigator(config, {
    return createStackNavigator(config, {
        initialRouteKey: `_stack_${key}`,
        navigationOptions: ({ navigation, screenProps }) => ({
            ...getActiveChildNavigationOptions(navigation, screenProps),
        }),
    });
};

// Add static method "navigationOptions" to nested component
// this way it's possible to dynamically change Navigation settings (title, etc.) from view. See: @suite-support/Head
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

    // withNavigationFocus
    return Component;

    // return (props: any) => {
    //     // const [state, setState] = useState('unknown')
    //     // useEffect(() => {
    //     //     console.log("---NAV MOUNT", )

    //     //     props.navigation.addListener('didBlur', (a) => {
    //     //         console.log("---NAV didBlur", a)
    //     //         setState('didBlur')
    //     //     })

    //     //     props.navigation.addListener('didFocus', (a) => {
    //     //         console.log("---NAV didFocus", a)
    //     //         setState('didFocus')
    //     //     })
    //     //     props.navigation.addListener('willFocus', (a) => {
    //     //         console.log("---NAV willFocus", props.navigation.state)
    //     //         setState('willFocus')
    //     //     })
    //     // }, []);
    //     // console.log("---RENDER NAV OPT")
    //     // return <Component {...props} focusState={state} />;
    //     return <Component {...props} />;
    // };
};

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

const useDrawerStack = (key: string, screen: ScreenComponent) => {
    return useDrawer(key, useStack(key, screen));
};

const useTabs = (key: string, config: ScreenConfigMap) => {
    return useDrawer(
        key,
        useStack(
            key,
            createBottomTabNavigator(config, {
                backBehavior: 'none', // 'history'
                tabBarComponent: TabsBar,

                // pass child Tab.navigationOptions received from by `withNavigationOptions` wrapper
                navigationOptions: ({ navigation, screenProps }) => {
                    return {
                        headerMode: 'float',
                        headerStyle: {
                            backgroundColor: '#f4511e',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                        ...getActiveChildNavigationOptions(navigation, screenProps),
                    };
                },
            }),
        ),
    );
};

export type Config = (
    | {
          key: string;
          type: 'default' | 'drawer';
          screen: ScreenComponent;
      }
    | {
          key: string;
          type: 'tabs';
          tabs: {
              key: string;
              screen: ScreenComponent;
          }[];
      }
)[];

export const create = (config: Config, initialRouteName: string): NavigationContainer => {
    const navigationConfig: ScreenConfigMap = {};
    config.forEach(app => {
        if (app.type === 'drawer') {
            navigationConfig[app.key] = {
                screen: useDrawerStack(app.key, withNavigationOptions(app.screen)),
            };
        } else if (app.type === 'tabs') {
            const tabConfig: ScreenConfigMap = {};
            app.tabs.forEach(tab => {
                tabConfig[tab.key] = withNavigationOptions(tab.screen);
            });
            navigationConfig[app.key] = {
                screen: useTabs(app.key, tabConfig),
            };
        } else {
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
