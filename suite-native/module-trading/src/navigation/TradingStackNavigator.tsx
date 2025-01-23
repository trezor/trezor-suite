import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    stackNavigationOptionsConfig,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

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
    </TradingStack.Navigator>
);
