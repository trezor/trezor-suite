import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CoinEnablingInitScreen } from '@suite-native/coin-enabling';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    AccountDetailScreen,
    AccountSettingsScreen,
} from '@suite-native/module-accounts-management';
import { AddCoinAccountStackNavigator } from '@suite-native/module-add-accounts';
import { DeviceCompromisedModalScreen } from '@suite-native/module-authenticity-checks';
import { AuthorizeDeviceStackNavigator } from '@suite-native/module-authorize-device';
import {
    ConnectPopupScreen,
    WalletConnectPairScreen,
    WalletConnectSessionPopupScreen,
} from '@suite-native/module-connect-popup';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import { DeviceSettingsStackNavigator } from '@suite-native/module-device-settings';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';
import { SendStackNavigator } from '@suite-native/module-send';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { StakingDetailScreen } from '@suite-native/module-staking-management';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { ReceiveStackNavigator } from '@suite-native/receive';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { TransactionDetailScreen } from '@suite-native/transactions';

import { AppTabNavigator } from './AppTabNavigator';
import { useGlobalHooks } from '../hooks/useGlobalHooks';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    useGlobalHooks();

    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    const getInitialRouteName = () => {
        if (isOnboardingFinished) {
            return RootStackRoutes.AppTabs;
        }

        return RootStackRoutes.OnboardingStack;
    };

    return (
        <RootStack.Navigator
            initialRouteName={getInitialRouteName()}
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen
                name={RootStackRoutes.OnboardingStack}
                component={OnboardingStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.AppTabs} component={AppTabNavigator} />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
                component={AccountSettingsScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.TransactionDetail }}
                name={RootStackRoutes.TransactionDetail}
                component={TransactionDetailScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountDetail }}
                name={RootStackRoutes.AccountDetail}
                component={AccountDetailScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.StakingDetail }}
                name={RootStackRoutes.StakingDetail}
                component={StakingDetailScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.DevUtilsStack}
                component={DevUtilsStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.ConnectPopup} component={ConnectPopupScreen} />
            <RootStack.Screen
                name={RootStackRoutes.WalletConnectSessionPopup}
                component={WalletConnectSessionPopupScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.WalletConnectPair}
                component={WalletConnectPairScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.SettingsScreenStack}
                component={SettingsStackNavigator}
            />
            <RootStack.Screen
                name={RootStackRoutes.DeviceCompromisedModalScreen}
                component={DeviceCompromisedModalScreen}
            />
            {/* Navigation flows that start by push from bottom animation on the first screen of its stack. */}
            <RootStack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
                <RootStack.Screen
                    name={RootStackRoutes.AccountsImport}
                    component={AccountsImportStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.AddCoinAccountStack}
                    component={AddCoinAccountStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.CoinEnablingInit}
                    component={CoinEnablingInitScreen}
                />
                <RootStack.Screen
                    name={RootStackRoutes.ReceiveStack}
                    component={ReceiveStackNavigator}
                />
                <RootStack.Screen name={RootStackRoutes.SendStack} component={SendStackNavigator} />
                <RootStack.Screen
                    name={RootStackRoutes.DeviceSettingsStack}
                    component={DeviceSettingsStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.AuthorizeDeviceStack}
                    component={AuthorizeDeviceStackNavigator}
                    options={{
                        gestureEnabled: false,
                    }}
                />
            </RootStack.Group>
        </RootStack.Navigator>
    );
};
