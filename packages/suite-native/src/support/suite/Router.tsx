/**
 * Combination of @suite-support/Router and @suite-web/pages || @suite-desktop/pages
 * Differences:
 * - Routes are declared in similar structure as next.js "pages" directories (@suite-web/pages)
 * - Unlike next.js views are not separated into chunks, so all files are imported here in one place and assigned to a proper Scene (route)
 * - missing / not used routes: "/bridge", "/version"
 * - additional routes: "/device-select"
 */

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { BackHandler } from 'react-native';
import {
    NavigationState,
    StackActions,
    NavigationActions,
    NavigationAction,
    NavigationParams,
    NavigationContainer,
    NavigationContainerComponent,
    NavigationStateRoute,
} from 'react-navigation';
import { enableScreens } from 'react-native-screens'; // https://github.com/kmagiera/react-native-screens
import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html

import { create } from './RouterBuilder';

import { getRoute, RouteParams } from '@suite-utils/router';

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
import { ROUTER } from '@suite-actions/constants';

// import DeviceSelect from '../components/DeviceSelect';

import { AppState, Dispatch } from '@suite-types';

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
                key: getRoute('suite-device-backup'),
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

// custom Navigation state with optional fields and types for Navigator.state.params
type RouteState = NavigationStateRoute<{
    routeParams: RouteParams; // used in LOCATION.CHANGE action
    navigationOptions: NavigationParams; // used in Navigation state
}> & {
    isDrawerOpen?: boolean; // instead of import { NavigationDrawerState } from 'react-navigation-drawer';
};

// NavigationContainerComponent.state state is wrapped in to "nav" object
type FixedNavigationContainerComponent = NavigationContainerComponent & {
    // state: NavigationContainerComponent['state'] & {
    //     nav: NavigationContainerComponent['state'],
    // }
    dispatch: NavigationContainerComponent['dispatch'];
    state: NavigationContainerComponent['state'] & {
        nav?: RouteState;
    };
};

type IReduxNavigator<P> = React.FunctionComponent<P> & {
    navigator?: FixedNavigationContainerComponent | null;
    state?: RouteState;
};

type Props = {
    router: AppState['router'];
    dispatch: Dispatch;
};

// Utilities:
export const getActiveRoute = (state: NavigationState): RouteState => {
    if (!state.routes || state.routes.length === 0 || state.index >= state.routes.length) {
        return state as RouteState;
    }
    const childActiveRoute = state.routes[state.index] as RouteState;
    return getActiveRoute(childActiveRoute);
};

export const isDrawerOpened = (state?: RouteState): boolean => {
    if (!state) return false;
    if (state.isDrawerOpen) return true;
    if (!state.routes || state.routes.length === 0) {
        return false;
    }
    const childActiveRoute = state.routes[state.index] as RouteState;
    return isDrawerOpened(childActiveRoute);
};

// Wrap `Navigator` with redux connected component
// - hold reference to NavigationContainerComponent once it's mounted
// - handle Navigation state change and dispatch LOCATION.CHANGE action
// - handle android back button

export const ReduxNavigator: IReduxNavigator<Props> = props => {
    const [navigator, setNavigator] = useState<FixedNavigationContainerComponent | null>(null);
    // Set reference as static filed accessible from outside
    ReduxNavigator.navigator = navigator;
    ReduxNavigator.state = navigator ? navigator.state.nav : undefined;

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
            console.log('LOCATION.CVHNAE', action.type, activeRoute, action);
            props.dispatch({
                type: ROUTER.LOCATION_CHANGE,
                url: activeRoute.routeName,
            });

            // console.log(JSON.stringify(_oldState, null, 2));
            // console.log('---------------------');
            // console.log(JSON.stringify(newState, null, 2));
        }
    };

    useEffect(() => {
        const onBack = () => {
            if (ReduxNavigator.navigator) {
                if (isDrawerOpened(ReduxNavigator.navigator.state.nav)) {
                    ReduxNavigator.navigator.dispatch(NavigationActions.back());
                }
            }
            return true;
        };
        BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onBack);
            // TrezorConnect.dispose();
        };
    }, []);

    if (!Navigator) {
        // initialize here to pass current route from reducer
        Navigator = initNavigator(props.router.pathname);
    }

    // TODO:
    // - add ThemeProvider
    // - https://reactnavigation.org/docs/en/state-persistence.html#usage
    // - withNavigationFocus,
    // - withOrientation, createKeyboardAwareNavigator

    return (
        <Navigator
            onNavigationStateChange={onNavigationStateChange}
            ref={nav => setNavigator(nav)}
        />
    );
};

export default connect((state: AppState) => ({ router: state.router }))(ReduxNavigator);
