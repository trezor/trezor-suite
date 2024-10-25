import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketTransactionsList } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsList';

export const CoinmarketTransactions = () => (
    <CoinmarketContainer SectionComponent={CoinmarketTransactionsList} />
);
