import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SendStackParamList,
    SendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SendAccountsScreen } from '../screens/SendAccountsScreen';
import { SendFormScreen } from '../screens/SendFormScreen';
import { SendReviewScreen } from '../screens/SendReviewScreen';

const SendStack = createNativeStackNavigator<SendStackParamList>();

export const SendStackNavigator = () => (
    <SendStack.Navigator
        initialRouteName={SendStackRoutes.SendAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SendStack.Screen name={SendStackRoutes.SendAccounts} component={SendAccountsScreen} />
        <SendStack.Screen name={SendStackRoutes.SendForm} component={SendFormScreen} />
        <SendStack.Screen name={SendStackRoutes.SendReview} component={SendReviewScreen} />
    </SendStack.Navigator>
);
