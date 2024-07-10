import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    AccountDetailScreen,
    AccountSettingsScreen,
} from '@suite-native/module-accounts-management';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import { TransactionDetailScreen } from '@suite-native/transactions';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';
import { ReceiveModalScreen } from '@suite-native/receive';
import { AuthorizeDeviceStackNavigator } from '@suite-native/module-authorize-device';
import { AddCoinAccountStackNavigator } from '@suite-native/module-add-accounts';
import { DeviceInfoModalScreen, useHandleDeviceConnection } from '@suite-native/device';
import { SendStackNavigator } from '@suite-native/module-send';

import { AppTabNavigator } from './AppTabNavigator';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    useHandleDeviceConnection();

    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    const getInitialRouteName = () => {
        if (isOnboardingFinished) {
            return RootStackRoutes.AppTabs;
        }

        return RootStackRoutes.Onboarding;
    };

    return (
        <RootStack.Navigator
            initialRouteName={getInitialRouteName()}
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen
                name={RootStackRoutes.Onboarding}
                component={OnboardingStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.AppTabs} component={AppTabNavigator} />
            <RootStack.Screen
                name={RootStackRoutes.AccountsImport}
                component={AccountsImportStackNavigator}
            />
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
                name={RootStackRoutes.DevUtilsStack}
                component={DevUtilsStackNavigator}
            />
            <RootStack.Screen
                name={RootStackRoutes.AddCoinAccountStack}
                component={AddCoinAccountStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.ReceiveModal} component={ReceiveModalScreen} />
            <RootStack.Screen name={RootStackRoutes.DeviceInfo} component={DeviceInfoModalScreen} />
            <RootStack.Screen
                name={RootStackRoutes.AuthorizeDeviceStack}
                component={AuthorizeDeviceStackNavigator}
                options={{
                    ...stackNavigationOptionsConfig,
                    animation: 'slide_from_bottom',
                }}
            />
            <RootStack.Screen name={RootStackRoutes.SendStack} component={SendStackNavigator} />
        </RootStack.Navigator>
    );
};
