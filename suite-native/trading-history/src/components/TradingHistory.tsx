import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingTransaction,
    selectDeviceTradingTradesOrderedByDate,
} from '@suite-common/trading';
import { Box, EdgeFades, useBottomSheetControls } from '@suite-native/atoms';
import { Footer } from '@suite-native/trading-provider-utils';
import { selectTradeToBeOpened, tradingActions } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TradeDetailSheet } from './TradeDetailSheet/TradeDetailSheet';
import { TradeHistoryListItem } from './TradeHistoryListItem/TradeHistoryListItem';
import { TradeTypeEmptyState } from './TradeTypeEmptyState';
import { TradingHistoryEmptyState } from './TradingHistoryEmptyState';
import { type TradingHistoryFilter, TradingHistoryTabs } from './TradingHistoryTabs';

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingTop: utils.spacings.sp24,
    paddingBottom: Math.max(insetBottom, utils.spacings.sp24),
}));

const listFooterStyle = prepareNativeStyle(({ spacings }) => ({
    paddingTop: spacings.sp32,
}));

const keyExtractor = (item: TradingTransaction) =>
    item.key ?? item.data.orderId ?? `${item.tradeType}-${item.date}`;

export type TradingHistoryProps = {
    onOpenTradeDetail?: (orderId: string) => void;
};

export const TradingHistory = ({ onOpenTradeDetail }: TradingHistoryProps) => {
    const navigation = useNavigation();
    const { applyStyle, utils } = useNativeStyles();
    const dispatch = useDispatch();
    const { bottom: insetBottom } = useSafeAreaInsets();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const [detailOrderId, setDetailOrderId] = useState<string | undefined>(undefined);
    const flashListRef = useRef<FlashListRef<TradingTransaction>>(null);
    const [activeFilter, setActiveFilter] = useState<TradingHistoryFilter>('all');
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const trades = useSelector((state: TradingRootStateWithDeviceAndAccounts) =>
        selectDeviceTradingTradesOrderedByDate(state),
    );

    const filteredTrades =
        activeFilter === 'all' ? trades : trades.filter(trade => trade.tradeType === activeFilter);

    const handleSelectedTrade = useCallback(
        (trade: TradingTransaction) => {
            const { orderId } = trade.data;

            if (!orderId) {
                return;
            }

            if (onOpenTradeDetail) {
                onOpenTradeDetail(orderId);

                return;
            }

            setDetailOrderId(orderId);
            if (!isSheetVisible) {
                showSheet();
            }
        },
        [isSheetVisible, onOpenTradeDetail, showSheet],
    );

    useEffect(() => {
        flashListRef.current?.scrollToTop({ animated: false });
    }, [activeFilter]);

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

    if (trades.length === 0) {
        return <TradingHistoryEmptyState onBackToTradeForm={navigation.goBack} />;
    }

    return (
        <Box flex={1}>
            <Box paddingTop="sp16">
                <TradingHistoryTabs value={activeFilter} onChange={setActiveFilter} />
            </Box>
            <Box flex={1}>
                <FlashList
                    ref={flashListRef}
                    testID="@trading/history/list"
                    contentContainerStyle={applyStyle(contentContainerStyle, {
                        insetBottom,
                    })}
                    renderItem={renderItem}
                    data={filteredTrades}
                    keyExtractor={keyExtractor}
                    ListEmptyComponent={
                        activeFilter === 'all' ? null : (
                            <TradeTypeEmptyState
                                tradeType={activeFilter}
                                onShowAllTrades={() => setActiveFilter('all')}
                            />
                        )
                    }
                    ListFooterComponent={<Footer />}
                    ListFooterComponentStyle={applyStyle(listFooterStyle)}
                    maintainVisibleContentPosition={{ disabled: true }}
                />
                <EdgeFades
                    direction="vertical"
                    startSize={utils.spacings.sp52}
                    endSize={Math.max(insetBottom, utils.spacings.sp24)}
                />
            </Box>
            <TradeDetailSheet
                isVisible={isSheetVisible}
                orderId={detailOrderId}
                onDismiss={hideSheet}
            />
        </Box>
    );
};
