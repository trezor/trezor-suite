import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SendStackParamList,
    SendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SendAccountsScreen } from '../screens/SendAccountsScreen';
import { SendOutputsScreen } from '../screens/SendOutputsScreen';
import { SendReviewScreen } from '../screens/SendReviewScreen';
import { SendFeesScreen } from '../screens/SendFeesScreen';

const SendStack = createNativeStackNavigator<SendStackParamList>();

export const SendStackNavigator = () => (
    <SendStack.Navigator
        initialRouteName={SendStackRoutes.SendAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SendStack.Screen name={SendStackRoutes.SendAccounts} component={SendAccountsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendOutputs} component={SendOutputsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendFees} component={SendFeesScreen} />
        <SendStack.Screen name={SendStackRoutes.SendReview} component={SendReviewScreen} />
    </SendStack.Navigator>
);
