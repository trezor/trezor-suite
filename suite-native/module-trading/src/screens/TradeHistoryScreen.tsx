import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import {
    TradingRootState,
    TradingTransaction,
    selectTradingTradesByTradeTypeOrderedByDate,
} from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailSheet } from '../components/general/TradeDetailSheet/TradeDetailSheet';
import {
    TRADE_HISTORY_LIST_ITEM_HEIGHT,
    TradeHistoryListItem,
} from '../components/general/TradeHistory/TradeHistoryListItem';
import { useBottomSheetControls } from '../hooks/useBottomSheetControls';

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
}));

const keyExtractor = (item: TradingTransaction) => `${item.key ?? ''}`;

export const TradeHistoryScreen = () => {
    const {
        params: { tradeType },
    } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.TradeHistory>>();
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { bottom: insetBottom } = useSafeAreaInsets();

    const [detailOrderId, setDetailOrderId] = useState<string | undefined>(undefined);
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const trades = useSelector((state: TradingRootState) =>
        selectTradingTradesByTradeTypeOrderedByDate(state, tradeType),
    );

    const handleSelectedTrade = useCallback(
        (trade: TradingTransaction) => {
            const { orderId } = trade.data;

            setDetailOrderId(orderId);
            if (orderId && !isSheetVisible) {
                showSheet();
            }
        },
        [isSheetVisible, showSheet],
    );

    const renderItem = ({ item }: { item: TradingTransaction }) => (
        <TradeHistoryListItem transaction={item} onPress={() => handleSelectedTrade(item)} />
    );

    return (
        <Screen
            header={
                <ScreenHeader
                    content={translate('moduleTrading.tradeHistory.list.title')}
                    closeActionType="back"
                />
            }
        >
            <FlashList
                contentContainerStyle={applyStyle(contentContainerStyle, {
                    insetBottom,
                })}
                renderItem={renderItem}
                data={trades}
                estimatedItemSize={TRADE_HISTORY_LIST_ITEM_HEIGHT}
                keyExtractor={keyExtractor}
            />
            <TradeDetailSheet
                isVisible={isSheetVisible}
                orderId={detailOrderId}
                onClose={hideSheet}
            />
        </Screen>
    );
};
