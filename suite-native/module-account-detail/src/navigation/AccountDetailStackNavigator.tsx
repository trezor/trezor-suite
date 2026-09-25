import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AccountAssetsScreen } from '../screens/AccountAssetsScreen';
import { AccountDetailScreen } from '../screens/AccountDetailScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';

const AccountDetailStack = createNativeStackNavigator<AccountDetailStackParamList>();

export const AccountDetailStackNavigator = () => (
    <AccountDetailStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={AccountDetailStackRoutes.AccountDetail}
    >
        <AccountDetailStack.Screen
            name={AccountDetailStackRoutes.AccountDetail}
            component={AccountDetailScreen}
        />
        <AccountDetailStack.Screen
            name={AccountDetailStackRoutes.AccountAssets}
            component={AccountAssetsScreen}
        />
        <AccountDetailStack.Screen
            name={AccountDetailStackRoutes.AccountSettings}
            component={AccountSettingsScreen}
        />
    </AccountDetailStack.Navigator>
);
