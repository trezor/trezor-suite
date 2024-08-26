import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SendStackParamList,
    SendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SendAccountsScreen } from '../screens/SendAccountsScreen';
import { SendOutputsScreen } from '../screens/SendOutputsScreen';
import { SendFeesScreen } from '../screens/SendFeesScreen';
import { SendAddressReviewScreen } from '../screens/SendAddressReviewScreen';
import { SendOutputsReviewScreen } from '../screens/SendOutputsReviewScreen';

const SendStack = createNativeStackNavigator<SendStackParamList>();

export const SendStackNavigator = () => (
    <SendStack.Navigator
        initialRouteName={SendStackRoutes.SendAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SendStack.Screen name={SendStackRoutes.SendAccounts} component={SendAccountsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendOutputs} component={SendOutputsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendFees} component={SendFeesScreen} />
        <SendStack.Screen
            name={SendStackRoutes.SendAddressReview}
            component={SendAddressReviewScreen}
        />
        <SendStack.Screen
            name={SendStackRoutes.SendOutputsReview}
            component={SendOutputsReviewScreen}
        />
    </SendStack.Navigator>
);
