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
import { useWatchTrade } from '../../../hooks/general/useWatchTrade';

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

    useWatchTrade({
        account: account ?? undefined,
        trade: transaction,
        isInProgress: false,
    });

    return <TradeHistoryListItemMemoized transaction={transaction} onPress={onPress} />;
};
