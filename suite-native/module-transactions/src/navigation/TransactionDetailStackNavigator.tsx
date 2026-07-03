import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { CancelTransactionReviewScreen } from '../screens/CancelTransactionReviewScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';

const TransactionDetailStack = createNativeStackNavigator<TransactionDetailStackParamList>();

export const TransactionDetailStackNavigator = () => (
    <TransactionDetailStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <TransactionDetailStack.Screen
            name={TransactionDetailStackRoutes.TransactionDetail}
            component={TransactionDetailScreen}
        />
        <TransactionDetailStack.Screen
            name={TransactionDetailStackRoutes.CancelTransactionReview}
            component={CancelTransactionReviewScreen}
        />
    </TransactionDetailStack.Navigator>
);
