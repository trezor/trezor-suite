import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    TradingStackParamList,
    TradingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAccountsPickerScreen } from '../screens/ReceiveAccountsPickerScreen';
import { TradeHistoryScreen } from '../screens/TradeHistoryScreen';
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
            component={ReceiveAccountsPickerScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradeHistory }}
            name={TradingStackRoutes.TradeHistory}
            component={TradeHistoryScreen}
        />
    </TradingStack.Navigator>
);
