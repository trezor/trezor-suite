import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { TradingHistory, TradingHistoryExportButton } from '@suite-native/trading-history';

export const TradingHistoryScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.TradingHistory>>();
    const openTradeDetailScreen = useCallback(
        (orderId: string) => {
            navigation.navigate(RootStackRoutes.TradingHistoryDetail, { orderId });
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
        >
            <TradingHistory onOpenTradeDetail={openTradeDetailScreen} />
        </Screen>
    );
};
