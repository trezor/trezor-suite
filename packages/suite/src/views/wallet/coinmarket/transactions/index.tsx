import { withSelectedAccountLoaded } from 'src/components/wallet';
import { CoinmarketAccountTransactions } from '../common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const CoinmarketTransactions = () => {
    return <CoinmarketAccountTransactions />;
};

export default withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketTransactions, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
