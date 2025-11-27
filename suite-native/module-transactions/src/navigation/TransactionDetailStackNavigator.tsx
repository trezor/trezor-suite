import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { TransactionDetailOverviewScreen } from '../screens/TransactionDetailOverviewScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';

const TransactionDetailStack = createNativeStackNavigator<TransactionDetailStackParamList>();

export const TransactionDetailStackNavigator = () => (
    <TransactionDetailStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <TransactionDetailStack.Screen
            name={TransactionDetailStackRoutes.TransactionDetail}
            component={TransactionDetailScreen}
        />
        <TransactionDetailStack.Screen
            name={TransactionDetailStackRoutes.TransactionDetailOverview}
            component={TransactionDetailOverviewScreen}
        />
    </TransactionDetailStack.Navigator>
);
