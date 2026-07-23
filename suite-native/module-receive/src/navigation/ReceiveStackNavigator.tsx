import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAccountsScreen } from '../screens/ReceiveAccountsScreen';
import { ReceiveAddressScreen } from '../screens/ReceiveAddressScreen';
import { ReceiveAddressVerificationScreen } from '../screens/ReceiveAddressVerificationScreen';

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
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAddress}
            component={ReceiveAddressScreen}
        />
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAddressVerification}
            component={ReceiveAddressVerificationScreen}
        />
    </ReceiveStack.Navigator>
);
