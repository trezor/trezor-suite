import { useSelector } from 'react-redux';

import { DeviceRootState } from '@suite-common/device';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-blockchain';

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
        selectAccountByKey(
            state,
            'selectedAccountKey' in transaction
                ? transaction.selectedAccountKey
                : transaction.sendAccountKey,
        ),
    );

    useWatchTrade({
        account: account ?? undefined,
        trade: transaction,
        isInProgress: false,
    });

    return <TradeHistoryListItemMemoized transaction={transaction} onPress={onPress} />;
};
