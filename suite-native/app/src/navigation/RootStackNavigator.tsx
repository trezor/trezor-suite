import { useSelector } from 'react-redux';
import { View, StyleSheet } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { AccountDetailScreen, AccountSettingsScreen } from '@suite-native/module-accounts';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import { TransactionDetailScreen } from '@suite-native/transactions';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';
import { selectUserHasAccounts } from '@suite-common/wallet-core';
import { ReceiveModal } from '@suite-native/receive';
import { useTakeScreenshot } from '@suite-native/screen-overlay';

import { AppTabNavigator } from './AppTabNavigator';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const screenshotViewRef = useRef<View | null>(null);

    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const userHasAccounts = useSelector(selectUserHasAccounts);
    const navigation = useNavigation();

    const takeScreenshot = useTakeScreenshot();

    const getInitialRouteName = () => {
        if (isOnboardingFinished && userHasAccounts) {
            return RootStackRoutes.AppTabs;
        }
        if (isOnboardingFinished && !userHasAccounts) {
            return RootStackRoutes.AccountsImport;
        }
        return RootStackRoutes.Onboarding;
    };

    // Take screenshot on navigation state change so it can be used for biometrics and other overlays later.
    useEffect(() => {
        const removeStateSubscription = navigation.addListener('state', () => {
            takeScreenshot(screenshotViewRef);
        });

        return removeStateSubscription;
    }, [navigation, takeScreenshot]);

    return (
        <View style={StyleSheet.absoluteFillObject} ref={screenshotViewRef}>
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
                <RootStack.Screen name={RootStackRoutes.ReceiveModal} component={ReceiveModal} />
            </RootStack.Navigator>
        </View>
    );
};
