import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    TradingStackParamList,
    TradingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { TradingExchangeApprovalScreen } from '../screens/TradingExchangeApprovalScreen';
import { TradingExchangePreviewScreen } from '../screens/TradingExchangePreviewScreen';
import { TradingExchangeRevokeScreen } from '../screens/TradingExchangeRevokeScreen';
import { TradingHistoryScreen } from '../screens/TradingHistoryScreen';
import {
    TradingExchangeOutputsReviewScreen,
    TradingSellOutputsReviewScreen,
} from '../screens/TradingOutputsReviewScreen';
import { TradingReceiveAccountsPickerScreen } from '../screens/TradingReceiveAccountsPickerScreen';
import { TradingScreen } from '../screens/TradingScreen';
import { TradingSellPreviewScreen } from '../screens/TradingSellPreviewScreen';

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
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingExchangePreview }}
            name={TradingStackRoutes.TradingExchangePreview}
            component={TradingExchangePreviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingExchangeApproval }}
            name={TradingStackRoutes.TradingExchangeApproval}
            component={TradingExchangeApprovalScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingExchangeRevoke }}
            name={TradingStackRoutes.TradingExchangeRevoke}
            component={TradingExchangeRevokeScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingSellPreview }}
            name={TradingStackRoutes.TradingSellPreview}
            component={TradingSellPreviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingSellOutputsReview }}
            name={TradingStackRoutes.TradingSellOutputsReview}
            component={TradingSellOutputsReviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingExchangeOutputsReview }}
            name={TradingStackRoutes.TradingExchangeOutputsReview}
            component={TradingExchangeOutputsReviewScreen}
        />
    </TradingStack.Navigator>
);
