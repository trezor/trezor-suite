/**
 * Combination of @suite-support/Router and @suite-web/pages || @suite-desktop/pages
 * Differences:
 * - Routes are declared in similar structure as next.js "pages" directories (@suite-web/pages)
 * - Unlike next.js views are not separated into chunks, so all files are imported in one place: `router.config`
 * - not used routes: "/bridge", "/version"
 * - additional routes: "/device-select"
 */

import React, { useEffect } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import { BackHandler } from 'react-native';
import { NavigationContainer } from 'react-navigation';
import { enableScreens } from 'react-native-screens'; // https://github.com/kmagiera/react-native-screens
import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html

import * as routerActions from '@suite-actions/routerActions';
import { create } from './RouterBuilder';
import config from './router.config';
import { setNavigator } from './NavigatorService';

enableScreens();

let Navigator: NavigationContainer | typeof undefined;

// Wrap `Navigator` with redux connected component
// - set reference to NavigationContainerComponent once it's mounted > NavigatorService.setNavigator
// - handle Navigation state change > routerActions.onNavigationStateChange
// - handle android back button > routerActions.androidBack

export const ReduxNavigator = () => {
    const initialPathName = useSelector(s => s.router.pathname);
    const { onNavigationStateChange, androidBack } = useActions({
        onNavigationStateChange: routerActions.onNavigationStateChange,
        androidBack: routerActions.androidBack,
    });
    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', androidBack);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', androidBack);
            // TrezorConnect.dispose();
        };
    }, [androidBack]);

    if (!Navigator) {
        // initialize and pass current route from suite reducer
        Navigator = create(config, initialPathName);
    }

    // TODO:
    // - add ThemeProvider
    // - https://reactnavigation.org/docs/en/state-persistence.html#usage
    // - withNavigationFocus,
    // - withOrientation, createKeyboardAwareNavigator

    return <Navigator onNavigationStateChange={onNavigationStateChange} ref={setNavigator} />;
};

export default ReduxNavigator;
