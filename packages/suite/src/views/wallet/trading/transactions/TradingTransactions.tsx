import { useSelector } from 'react-redux';

import { selectDeviceHasTradingTrades } from '@suite-common/trading';

import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingTransactionsEmptyState } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsEmptyState';
import { TradingTransactionsList } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsList';

export const TradingTransactions = () => {
    const hasTrades = useSelector(selectDeviceHasTradingTrades);

    return (
        <TradingContainer>
            {hasTrades ? <TradingTransactionsList /> : <TradingTransactionsEmptyState />}
        </TradingContainer>
    );
};
