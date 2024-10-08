import { CoinmarketAccountTransactions } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

export const CoinmarketTransactions = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_LAST_TRANSACTIONS"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketAccountTransactions}
    />
);
