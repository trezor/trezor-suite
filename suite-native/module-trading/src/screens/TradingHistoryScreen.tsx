import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import {
    TradingRootState,
    TradingTransaction,
    selectDeviceTradingTradesByTradeTypeOrderedByDate,
} from '@suite-common/trading';
import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailSheet } from '../components/history/TradeDetailSheet/TradeDetailSheet';
import {
    TRADE_HISTORY_LIST_ITEM_HEIGHT,
    TradeHistoryListItem,
} from '../components/history/TradeHistoryListItem/TradeHistoryListItem';
import { useBottomSheetControls } from '../hooks/general/useBottomSheetControls';
import { selectTradeToBeOpened } from '../selectors/commonSelectors';
import { clearTradeOrderIdToBeOpened } from '../tradingSlice';

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
    const dispatch = useDispatch();
    const { bottom: insetBottom } = useSafeAreaInsets();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const [detailOrderId, setDetailOrderId] = useState<string | undefined>(undefined);
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const trades = useSelector((state: TradingRootState & AccountsRootState & DeviceRootState) =>
        selectDeviceTradingTradesByTradeTypeOrderedByDate(state, tradeType),
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

    useEffect(() => {
        // if there was trade to be opened, open it right away and clear the tradeOrderIdToBeOpened
        if (tradeToBeOpened) {
            handleSelectedTrade(tradeToBeOpened);
            dispatch(clearTradeOrderIdToBeOpened());
        }
    }, [tradeToBeOpened, handleSelectedTrade, dispatch]);

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
                onDismiss={hideSheet}
            />
        </Screen>
    );
};
