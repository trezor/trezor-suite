/**
 * Combination of @suite-support/Router and @suite-web/pages || @suite-desktop/pages
 * Differences:
 * - Routes are declared in similar structure as next.js "pages" directories (@suite-web/pages)
 * - Unlike next.js views are not separated into chunks, so all files are imported in one place: `router.config`
 * - not used routes: "/bridge", "/version"
 * - additional routes: "/device-select"
 */

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { BackHandler } from 'react-native';
import { NavigationContainer, NavigationContainerProps } from 'react-navigation';
import { enableScreens } from 'react-native-screens'; // https://github.com/kmagiera/react-native-screens
import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html

import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';

import { create } from './RouterBuilder';
import config from './router.config';
import { setNavigator } from './NavigatorService';

enableScreens();

let Navigator: NavigationContainer | typeof undefined;

// Wrap `Navigator` with redux connected component
// - set reference to NavigationContainerComponent once it's mounted > NavigatorService.setNavigator
// - handle Navigation state change > routerActions.onNavigationStateChange
// - handle android back button > routerActions.androidBack

const mapStateToProps = (state: AppState) => ({
    initialPathName: state.router.pathname,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onNavigationStateChange: bindActionCreators(routerActions.onNavigationStateChange, dispatch),
    androidBack: bindActionCreators(routerActions.androidBack, dispatch),
});

// type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;
type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        // <Navigator> does not accept returned thunk function
        onNavigationStateChange?: NavigationContainerProps<any>['onNavigationStateChange'];
    };

export const ReduxNavigator = (props: Props) => {
    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', props.androidBack);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', props.androidBack);
            // TrezorConnect.dispose();
        };
    }, [props.androidBack]);

    if (!Navigator) {
        // initialize and pass current route from suite reducer
        Navigator = create(config, props.initialPathName);
    }

    // TODO:
    // - add ThemeProvider
    // - https://reactnavigation.org/docs/en/state-persistence.html#usage
    // - withNavigationFocus,
    // - withOrientation, createKeyboardAwareNavigator

    return <Navigator onNavigationStateChange={props.onNavigationStateChange} ref={setNavigator} />;
};

export default connect(mapStateToProps, mapDispatchToProps)(ReduxNavigator);
