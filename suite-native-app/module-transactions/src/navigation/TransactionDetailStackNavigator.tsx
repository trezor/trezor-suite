import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';

const TransactionDetailStack = createNativeStackNavigator<TransactionDetailStackParamList>();

export const TransactionDetailStackNavigator = () => (
    <TransactionDetailStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <TransactionDetailStack.Screen
            name={TransactionDetailStackRoutes.TransactionDetail}
            component={TransactionDetailScreen}
        />
    </TransactionDetailStack.Navigator>
);
