import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import {
    AppTabsRoutes,
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    TradingStackRoutes,
} from '@suite-native/navigation';
import {
    selectIsTradingBuyEnabled,
    selectIsTradingEnabledForCountry,
    selectIsTradingExchangeEnabled,
} from '@suite-native/trading-state';

export type EarnNoBalanceAction = 'buy' | 'swap' | 'receive';

type UseEarnNoBalanceActionsParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    onActionPress?: (action: EarnNoBalanceAction) => void;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useEarnNoBalanceActions = ({
    accountKey,
    tokenContract,
    onActionPress,
}: UseEarnNoBalanceActionsParams) => {
    const navigation = useNavigation<NavigationProp>();
    const isTradingEnabledForCountry = useSelector(selectIsTradingEnabledForCountry);
    const isBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const isSwapEnabled = useSelector(selectIsTradingExchangeEnabled);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const navigateToTrading = (tradingType: 'buy' | 'exchange') => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.TradeStack,
            params: {
                screen: TradingStackRoutes.Trading,
                params: { tradingType },
            },
        });
    };

    const handleBuyPress = () => {
        onActionPress?.('buy');
        navigateToTrading('buy');
    };

    const handleSwapPress = () => {
        onActionPress?.('swap');
        navigateToTrading('exchange');
    };

    const handleReceivePress = () => {
        onActionPress?.('receive');
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAddress,
            params: {
                accountKey,
                tokenContract,
                closeActionType: 'close',
            },
        });
    };

    return {
        handleBuyPress: isTradingEnabledForCountry && isBuyEnabled ? handleBuyPress : undefined,
        handleSwapPress: isTradingEnabledForCountry && isSwapEnabled ? handleSwapPress : undefined,
        handleReceivePress: hasFirmwareAuthenticityCheckHardFailed ? undefined : handleReceivePress,
    };
};
