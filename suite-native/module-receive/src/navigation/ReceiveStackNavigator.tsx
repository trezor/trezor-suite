import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAccountsScreen } from '../screens/ReceiveAccountsScreen';
import { ReceiveAddressDetailScreen } from '../screens/ReceiveAddressDetailScreen';
import { ReceiveAddressListScreen } from '../screens/ReceiveAddressListScreen';
import { ReceiveAddressVerificationScreen } from '../screens/ReceiveAddressVerificationScreen';
import { ReceiveFreshAddressScreen } from '../screens/ReceiveFreshAddressScreen';

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
            component={ReceiveFreshAddressScreen}
        />
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAddressVerification}
            component={ReceiveAddressVerificationScreen}
        />
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAddressList}
            component={ReceiveAddressListScreen}
        />
        <ReceiveStack.Screen
            name={ReceiveStackRoutes.ReceiveAddressDetail}
            component={ReceiveAddressDetailScreen}
        />
    </ReceiveStack.Navigator>
);
