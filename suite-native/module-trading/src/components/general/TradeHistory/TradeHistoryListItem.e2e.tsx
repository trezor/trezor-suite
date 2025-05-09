import { Text } from '@suite-native/atoms';

import {
    TRADE_HISTORY_LIST_ITEM_HEIGHT as ORIGINAL_TRADE_HISTORY_LIST_ITEM_HEIGHT,
    TradeHistoryListItemMemoized,
    TradeHistoryListItemMemoizedProps,
} from './TradeHistoryListItemMemoized';

export const TRADE_HISTORY_LIST_ITEM_HEIGHT = ORIGINAL_TRADE_HISTORY_LIST_ITEM_HEIGHT + 12;

export const TradeHistoryListItem = ({
    transaction,
    onPress,
}: TradeHistoryListItemMemoizedProps) => (
    <>
        <Text>E2E:History item without watch</Text>
        <TradeHistoryListItemMemoized transaction={transaction} onPress={onPress} />
    </>
);
