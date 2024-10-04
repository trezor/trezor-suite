import { withSelectedAccountLoaded } from 'src/components/wallet';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketAccountTransactions } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';

const CoinmarketTransactionsComponent = () => {
    return (
        <>
            <CoinmarketAccountTransactions />
            <CoinmarketFooter />
        </>
    );
};

export const CoinmarketTransactions = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketTransactionsComponent, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
