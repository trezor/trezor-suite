import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceTradingTradesOrderedByDate } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { TradingTransactionItem } from './TradingTransactionItem/TradingTransactionItem';
import {
    getTradingTransactionSides,
    getTradingTransactionStatusData,
} from './TradingTransactionItem/tradingTransactionItemUtils';
import { type TradingTransactionsFilter, TradingTransactionsTabs } from './TradingTransactionsTabs';
import { TradingTransactionsTypeEmptyState } from './TradingTransactionsTypeEmptyState';
import { useTradingTransactionClick } from './useTradingTransactionClick';
import { useTradingTransactionsWatcher } from './useTradingTransactionsWatcher';

export const TradingTransactionsList = () => {
    const [activeFilter, setActiveFilter] = useState<TradingTransactionsFilter>('all');
    const trades = useSelector(selectDeviceTradingTradesOrderedByDate);
    const handleTradeClick = useTradingTransactionClick();

    useTradingTransactionsWatcher();

    const filteredTrades =
        activeFilter === 'all' ? trades : trades.filter(trade => trade.tradeType === activeFilter);

    return (
        <Column alignItems="center">
            <Column width="100%" maxWidth={800} gap={24}>
                <TradingTransactionsTabs activeFilter={activeFilter} onChange={setActiveFilter} />
                <Column gap={8} data-testid="@trading/transactions/list">
                    {filteredTrades.length === 0 && activeFilter !== 'all' && (
                        <TradingTransactionsTypeEmptyState
                            tradeType={activeFilter}
                            onShowAllTrades={() => setActiveFilter('all')}
                        />
                    )}
                    {filteredTrades.map(trade => {
                        const sides = getTradingTransactionSides(trade.data);
                        const { orderId } = trade.data;

                        if (!sides) {
                            return null;
                        }

                        return (
                            <TradingTransactionItem
                                key={`${trade.tradeType}-${trade.key}`}
                                from={sides.from}
                                to={sides.to}
                                date={trade.date}
                                status={getTradingTransactionStatusData(trade)}
                                onClick={() => handleTradeClick(trade)}
                                data-testid={
                                    orderId ? `@trading/transactions/trade/${orderId}` : undefined
                                }
                            />
                        );
                    })}
                </Column>
            </Column>
        </Column>
    );
};
