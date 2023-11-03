import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAccountsScreen } from '../screens/ReceiveAccountsScreen';

const ReceiveStack = createNativeStackNavigator<ReceiveStackParamList>();

export const ReceiveStackNavigator = () => (
    <ReceiveStack.Navigator
        initialRouteName={ReceiveStackRoutes.ReceiveAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAccounts}
            component={ReceiveAccountsScreen}
        />
    </ReceiveStack.Navigator>
);
