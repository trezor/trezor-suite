import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SendStackParamList,
    SendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SendAccountsScreen } from '../screens/SendAccountsScreen';
import { SendFormScreen } from '../screens/SendFormScreen';

const SendStack = createNativeStackNavigator<SendStackParamList>();

export const SendStackNavigator = () => (
    <SendStack.Navigator
        initialRouteName={SendStackRoutes.SendAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SendStack.Screen name={SendStackRoutes.SendAccounts} component={SendAccountsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendForm} component={SendFormScreen} />
    </SendStack.Navigator>
);
