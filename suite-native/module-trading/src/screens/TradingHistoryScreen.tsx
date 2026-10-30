import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, TradingFlowStackRoutes } from '@suite-native/navigation';
import { TradingHistory, TradingHistoryExportButton } from '@suite-native/trading-history';
import { type TradingFlowStackNavigationProp } from '@suite-native/trading-types';

export const TradingHistoryScreen = () => {
    const navigation =
        useNavigation<TradingFlowStackNavigationProp<TradingFlowStackRoutes.TradingHistory>>();
    const openTradeDetailScreen = useCallback(
        (orderId: string) => {
            navigation.navigate(TradingFlowStackRoutes.TradingHistoryDetail, { orderId });
        },
        [navigation],
    );

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradeHistory.list.title" />}
                    closeActionType="back"
                    rightIcon={<TradingHistoryExportButton />}
                />
            }
            isScrollable={false}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
        >
            <TradingHistory onOpenTradeDetail={openTradeDetailScreen} />
        </Screen>
    );
};
