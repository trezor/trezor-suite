import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type TradingStackParamList,
    TradingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { TradingRestrictedGuard } from '../components/general/TradingRestrictedGuard';
import { TradingBuyPreviewScreen } from '../screens/TradingBuyPreviewScreen';
import { TradingConfirmingScreen } from '../screens/TradingConfirmingScreen';
import { TradingExchangeApprovalScreen } from '../screens/TradingExchangeApprovalScreen';
import { TradingExchangePreviewScreen } from '../screens/TradingExchangePreviewScreen';
import { TradingExchangeRevokeScreen } from '../screens/TradingExchangeRevokeScreen';
import { TradingExchangeTransactionReviewScreen } from '../screens/TradingExchangeTransactionReviewScreen';
import { TradingHistoryDetailScreen } from '../screens/TradingHistoryDetailScreen';
import { TradingHistoryScreen } from '../screens/TradingHistoryScreen';
import { TradingMyAssetScreen } from '../screens/TradingMyAssetScreen';
import { TradingReceiveAccountsPickerScreen } from '../screens/TradingReceiveAccountsPickerScreen';
import { TradingReceiveAddressPickerScreen } from '../screens/TradingReceiveAddressPickerScreen';
import { TradingSellCompletionScreen } from '../screens/TradingSellCompletionScreen';
import { TradingSellPreviewScreen } from '../screens/TradingSellPreviewScreen';
import { TradingSellTransactionReviewScreen } from '../screens/TradingSellTransactionReviewScreen';
import { TradingTradeableAssetScreen } from '../screens/TradingTradeableAssetScreen';

const TradingStack = createNativeStackNavigator<TradingStackParamList>();

export const TradingStackNavigator = () => (
    <TradingStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        screenLayout={({ children }) => <TradingRestrictedGuard>{children}</TradingRestrictedGuard>}
    >
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingSellPreview }}
            name={TradingStackRoutes.TradingSellPreview}
            component={TradingSellPreviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingSellTransactionReview }}
            name={TradingStackRoutes.TradingSellTransactionReview}
            component={TradingSellTransactionReviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingExchangeTransactionReview }}
            name={TradingStackRoutes.TradingExchangeTransactionReview}
            component={TradingExchangeTransactionReviewScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingMyAsset }}
            name={TradingStackRoutes.TradingMyAsset}
            component={TradingMyAssetScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingTradeableAsset }}
            name={TradingStackRoutes.TradingTradeableAsset}
            component={TradingTradeableAssetScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.ReceiveAccounts }}
            name={TradingStackRoutes.ReceiveAccounts}
            component={TradingReceiveAccountsPickerScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingReceiveAddress }}
            name={TradingStackRoutes.TradingReceiveAddress}
            component={TradingReceiveAddressPickerScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingHistory }}
            name={TradingStackRoutes.TradingHistory}
            component={TradingHistoryScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingHistoryDetail }}
            name={TradingStackRoutes.TradingHistoryDetail}
            component={TradingHistoryDetailScreen}
        />
        <TradingStack.Screen
            options={{ title: TradingStackRoutes.TradingBuyPreview }}
            name={TradingStackRoutes.TradingBuyPreview}
            component={TradingBuyPreviewScreen}
        />
        {/* Trading screens that require a connected device as well as the restricted guard */}
        <TradingStack.Group
            screenLayout={({ children }) => (
                <TradingRestrictedGuard>
                    <TradingDeviceConnectionGuard>{children}</TradingDeviceConnectionGuard>
                </TradingRestrictedGuard>
            )}
        >
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
                options={{ title: TradingStackRoutes.TradingConfirming }}
                name={TradingStackRoutes.TradingConfirming}
                component={TradingConfirmingScreen}
            />
            <TradingStack.Screen
                options={{ title: TradingStackRoutes.TradingSellCompletion }}
                name={TradingStackRoutes.TradingSellCompletion}
                component={TradingSellCompletionScreen}
            />
        </TradingStack.Group>
    </TradingStack.Navigator>
);
