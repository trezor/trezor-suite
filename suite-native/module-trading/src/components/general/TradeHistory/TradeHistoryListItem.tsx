import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';

import {
    TradeHistoryListItemMemoized,
    TradeHistoryListItemMemoizedProps,
} from './TradeHistoryListItemMemoized';
import { useTradingWatchTrade } from '../../../hooks/useTradingWatchTrade';

export { TRADE_HISTORY_LIST_ITEM_HEIGHT } from './TradeHistoryListItemMemoized';

export const TradeHistoryListItem = ({
    transaction,
    onPress,
}: TradeHistoryListItemMemoizedProps) => {
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(
            state,
            transaction.account.descriptor,
            transaction.account.symbol,
        ),
    );

    useTradingWatchTrade({
        account: account ?? undefined,
        trade: transaction,
        isInProgress: false,
    });

    return <TradeHistoryListItemMemoized transaction={transaction} onPress={onPress} />;
};
