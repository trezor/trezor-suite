import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingTransaction,
    selectDeviceTradingTradesOrderedByDate,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useBottomSheetControls } from '@suite-native/trading-atoms';
import { selectTradeToBeOpened, tradingActions } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailSheet } from '../components/history/TradeDetailSheet/TradeDetailSheet';
import { TradeHistoryListItem } from '../components/history/TradeHistoryListItem/TradeHistoryListItem';

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
}));

const keyExtractor = (item: TradingTransaction) => `${item.key ?? ''}`;

export const TradingHistoryScreen = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { bottom: insetBottom } = useSafeAreaInsets();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const [detailOrderId, setDetailOrderId] = useState<string | undefined>(undefined);
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const trades = useSelector((state: TradingRootStateWithDeviceAndAccounts) =>
        selectDeviceTradingTradesOrderedByDate(state),
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
            dispatch(tradingActions.clearTradeOrderIdToBeOpened());
        }
    }, [tradeToBeOpened, handleSelectedTrade, dispatch]);

    const renderItem = ({ item }: { item: TradingTransaction }) => (
        <TradeHistoryListItem transaction={item} onPress={() => handleSelectedTrade(item)} />
    );

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradeHistory.list.title" />}
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
