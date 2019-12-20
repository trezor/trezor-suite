/**
 * Combination of @suite-support/Router and @suite-web/pages || @suite-desktop/pages
 * Differences:
 * - Routes are declared in similar structure as next.js "pages" directories (@suite-web/pages)
 * - Unlike next.js views are not separated into chunks, so all files are imported here in one place and assigned to a proper Scene (route)
 * - missing / not used routes: "/bridge", "/version"
 * - additional routes: "/device-select"
 */

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { BackHandler } from 'react-native';
import {
    NavigationState,
    StackActions,
    NavigationActions,
    NavigationAction,
    NavigationContainer,
} from 'react-navigation';
import { enableScreens } from 'react-native-screens'; // https://github.com/kmagiera/react-native-screens
import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html

import { getRoute } from '@suite-utils/router';
import * as routerActions from '@suite-actions/routerActions';

// Views
// import InitialRun from '../components/InitialRun';
import Dashboard from '@dashboard-views';

import AccountTransactions from '@wallet-views';
import AccountReceive from '@wallet-views/receive';
import AccountSend from '@wallet-views/send';
import AccountSignVerify from '@wallet-views/sign-verify';

import Exchange from '@exchange-views';
import Passwords from '@passwords-views';

import SettingsGeneral from '@settings-views';
import SettingsDevice from '@settings-views/device';
import SettingsWallet from '@settings-views/wallet';

import Onboarding from '@suite-views/onboarding';
import Firmware from '@suite-views/firmware';
import Backup from '@suite-views/backup';
import SwitchDevice from '@suite-views/switch-device';

// import DeviceSelect from '../components/DeviceSelect';

import { AppState, Dispatch } from '@suite-types';

import { create } from './RouterBuilder';
import { setNavigator, getActiveRoute } from './NavigatorService';

enableScreens();

let Navigator: NavigationContainer | typeof undefined;

const initNavigator = (initialRoute: string) =>
    create(
        [
            {
                key: getRoute('suite-index'),
                // type: 'default',
                type: 'drawer',
                screen: Dashboard,
            },
            {
                key: getRoute('wallet-index'),
                type: 'tabs',
                tabs: [
                    { key: getRoute('wallet-index'), screen: AccountTransactions },
                    { key: getRoute('wallet-account-receive'), screen: AccountReceive },
                    { key: getRoute('wallet-account-send'), screen: AccountSend },
                    { key: getRoute('wallet-account-sign-verify'), screen: AccountSignVerify },
                ],
            },
            {
                key: getRoute('exchange-index'),
                type: 'drawer',
                screen: Exchange,
            },
            {
                key: getRoute('passwords-index'),
                type: 'drawer',
                screen: Passwords,
            },
            {
                key: getRoute('settings-index'),
                type: 'tabs',
                tabs: [
                    { key: getRoute('settings-index'), screen: SettingsGeneral },
                    { key: getRoute('settings-device'), screen: SettingsDevice },
                    { key: getRoute('settings-wallet'), screen: SettingsWallet },
                ],
            },
            {
                key: getRoute('onboarding-index'),
                type: 'default',
                screen: Onboarding,
            },
            {
                key: getRoute('suite-device-firmware'),
                type: 'default',
                screen: Firmware,
            },
            {
                key: getRoute('settings-device'),
                type: 'default',
                screen: Backup,
            },
            {
                key: getRoute('suite-switch-device'),
                type: 'default',
                screen: SwitchDevice,
            },
        ],
        initialRoute,
    );

// Wrap `Navigator` with redux connected component
// - hold reference to NavigationContainerComponent once it's mounted
// - handle Navigation state change and dispatch LOCATION.CHANGE action
// - handle android back button

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onLocationChange: bindActionCreators(routerActions.onLocationChange, dispatch),
    androidBack: bindActionCreators(routerActions.androidBack, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export const ReduxNavigator = (props: Props) => {
    const onNavigationStateChange = (
        _oldState: NavigationState,
        newState: NavigationState,
        action: NavigationAction & { routeName?: string },
    ) => {
        const { routeName } = action;
        if (
            routeName ||
            action.type === NavigationActions.BACK ||
            action.type === StackActions.RESET
        ) {
            const activeRoute = getActiveRoute(newState);
            console.log('LOCATION.CHANGE', action.type, activeRoute, action);
            props.onLocationChange(activeRoute.routeName);

            // console.log(JSON.stringify(_oldState, null, 2));
            // console.log('---------------------');
            // console.log(JSON.stringify(newState, null, 2));
        }
    };

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', props.androidBack);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', props.androidBack);
            // TrezorConnect.dispose();
        };
    }, [props.androidBack]);

    if (!Navigator) {
        // initialize here to pass current route from reducer
        Navigator = initNavigator(props.router.pathname);
    }

    // TODO:
    // - add ThemeProvider
    // - https://reactnavigation.org/docs/en/state-persistence.html#usage
    // - withNavigationFocus,
    // - withOrientation, createKeyboardAwareNavigator

    return <Navigator onNavigationStateChange={onNavigationStateChange} ref={setNavigator} />;
};

export default connect(mapStateToProps, mapDispatchToProps)(ReduxNavigator);
