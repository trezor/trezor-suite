import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingTransactionsList } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsList';

export const TradingTransactions = () => (
    <TradingContainer SectionComponent={TradingTransactionsList} />
);
