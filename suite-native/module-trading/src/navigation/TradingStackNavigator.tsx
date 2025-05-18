import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    TradingStackParamList,
    TradingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { TradingHistoryScreen } from '../screens/TradingHistoryScreen';
import { TradingReceiveAccountsPickerScreen } from '../screens/TradingReceiveAccountsPickerScreen';
import { TradingScreen } from '../screens/TradingScreen';

const TradingStack = createNativeStackNavigator<TradingStackParamList>();

export const TradingStackNavigator = () => (
    <TradingStack.Navigator
        initialRouteName={TradingStackRoutes.Trading}
        screenOptions={stackNavigationOptionsConfig}
    >
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.Trading }}
            name={TradingStackRoutes.Trading}
            component={TradingScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.ReceiveAccounts }}
            name={TradingStackRoutes.ReceiveAccounts}
            component={TradingReceiveAccountsPickerScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingHistory }}
            name={TradingStackRoutes.TradingHistory}
            component={TradingHistoryScreen}
        />
    </TradingStack.Navigator>
);
