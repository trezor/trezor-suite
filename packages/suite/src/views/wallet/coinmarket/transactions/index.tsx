import { withSelectedAccountLoaded } from 'src/components/wallet';
import { CoinmarketAccountTransactions } from '../common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';

const CoinmarketTransactions = () => {
    return (
        <>
            <CoinmarketAccountTransactions />
            <CoinmarketFooter />
        </>
    );
};

export default withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketTransactions, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
