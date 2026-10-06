import { useSelector } from 'react-redux';

import { selectDeviceTradingTrades } from '@suite-common/trading';

import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingTransactionsEmptyState } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsEmptyState';
import { TradingTransactionsList } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsList';

export const TradingTransactions = () => {
    const trades = useSelector(selectDeviceTradingTrades);

    return (
        <TradingContainer>
            {trades.length > 0 ? <TradingTransactionsList /> : <TradingTransactionsEmptyState />}
        </TradingContainer>
    );
};
