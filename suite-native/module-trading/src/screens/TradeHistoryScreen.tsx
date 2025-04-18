import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import {
    TradingRootState,
    TradingTransaction,
    TradingTransactionBuy,
    selectTradingTradesByTradeType,
} from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    TRADE_HISTORY_LIST_ITEM_HEIGHT,
    TradeHistoryListItem,
} from '../components/general/TradeHistory/TradeHistoryListItem';
import { buildTradingUrl } from '../utils/tradeFormUtils';

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
    const trades = useSelector((state: TradingRootState) =>
        selectTradingTradesByTradeType(state, tradeType),
    );
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const handleSelectedTrade = (trade: TradingTransaction) => {
        if (trade.tradeType === 'buy') {
            // TODO: Open Trade detail in followup PR instead of this
            const buy = trade as TradingTransactionBuy;
            if (buy.data.partnerData) {
                navigation.navigate(RootStackRoutes.TradingWebView, {
                    closeCallbackUrl: buildTradingUrl({
                        actionType: 'trade',
                        tradeType: trade.tradeType,
                        orderId: trade.data.orderId,
                    }),
                    source: { uri: buy.data.partnerData },
                });
            }
        }
    };

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
        </Screen>
    );
};
