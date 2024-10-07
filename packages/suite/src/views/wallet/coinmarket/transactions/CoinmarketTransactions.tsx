import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketAccountTransactions } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketTransactionsComponent = () => {
    return (
        <>
            <CoinmarketAccountTransactions />
            <CoinmarketFooter />
        </>
    );
};

export const CoinmarketTransactions = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_LAST_TRANSACTIONS"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketTransactionsComponent}
    />
);
