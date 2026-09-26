import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AccountDetailScreen } from '../screens/AccountDetailScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';
import { AccountTokensScreen } from '../screens/AccountTokensScreen';

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
            name={AccountDetailStackRoutes.AccountTokens}
            component={AccountTokensScreen}
        />
        <AccountDetailStack.Screen
            name={AccountDetailStackRoutes.AccountSettings}
            component={AccountSettingsScreen}
        />
    </AccountDetailStack.Navigator>
);
