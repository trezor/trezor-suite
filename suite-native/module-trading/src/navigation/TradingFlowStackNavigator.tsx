import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type TradingFlowStackParamList,
    TradingFlowStackRoutes,
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

const TradingFlowStack = createNativeStackNavigator<TradingFlowStackParamList>();

export const TradingFlowStackNavigator = () => (
    <TradingFlowStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        screenLayout={({ children }) => <TradingRestrictedGuard>{children}</TradingRestrictedGuard>}
    >
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingSellPreview }}
            name={TradingFlowStackRoutes.TradingSellPreview}
            component={TradingSellPreviewScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingConfirming }}
            name={TradingFlowStackRoutes.TradingConfirming}
            component={TradingConfirmingScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingSellTransactionReview }}
            name={TradingFlowStackRoutes.TradingSellTransactionReview}
            component={TradingSellTransactionReviewScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingExchangeTransactionReview }}
            name={TradingFlowStackRoutes.TradingExchangeTransactionReview}
            component={TradingExchangeTransactionReviewScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingMyAsset }}
            name={TradingFlowStackRoutes.TradingMyAsset}
            component={TradingMyAssetScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingTradeableAsset }}
            name={TradingFlowStackRoutes.TradingTradeableAsset}
            component={TradingTradeableAssetScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.ReceiveAccounts }}
            name={TradingFlowStackRoutes.ReceiveAccounts}
            component={TradingReceiveAccountsPickerScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingReceiveAddress }}
            name={TradingFlowStackRoutes.TradingReceiveAddress}
            component={TradingReceiveAddressPickerScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingHistory }}
            name={TradingFlowStackRoutes.TradingHistory}
            component={TradingHistoryScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingHistoryDetail }}
            name={TradingFlowStackRoutes.TradingHistoryDetail}
            component={TradingHistoryDetailScreen}
        />
        <TradingFlowStack.Screen
            options={{ title: TradingFlowStackRoutes.TradingBuyPreview }}
            name={TradingFlowStackRoutes.TradingBuyPreview}
            component={TradingBuyPreviewScreen}
        />
        {/* Trading screens that require a connected device as well as the restricted guard */}
        <TradingFlowStack.Group
            screenLayout={({ children }) => (
                <TradingRestrictedGuard>
                    <TradingDeviceConnectionGuard>{children}</TradingDeviceConnectionGuard>
                </TradingRestrictedGuard>
            )}
        >
            <TradingFlowStack.Screen
                options={{ title: TradingFlowStackRoutes.TradingExchangePreview }}
                name={TradingFlowStackRoutes.TradingExchangePreview}
                component={TradingExchangePreviewScreen}
            />
            <TradingFlowStack.Screen
                options={{ title: TradingFlowStackRoutes.TradingExchangeApproval }}
                name={TradingFlowStackRoutes.TradingExchangeApproval}
                component={TradingExchangeApprovalScreen}
            />
            <TradingFlowStack.Screen
                options={{ title: TradingFlowStackRoutes.TradingExchangeRevoke }}
                name={TradingFlowStackRoutes.TradingExchangeRevoke}
                component={TradingExchangeRevokeScreen}
            />
            <TradingFlowStack.Screen
                options={{ title: TradingFlowStackRoutes.TradingSellCompletion }}
                name={TradingFlowStackRoutes.TradingSellCompletion}
                component={TradingSellCompletionScreen}
            />
        </TradingFlowStack.Group>
    </TradingFlowStack.Navigator>
);
