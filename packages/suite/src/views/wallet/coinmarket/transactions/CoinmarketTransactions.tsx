import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { useSelector } from 'src/hooks/suite';
import { CoinmarketTransactionsList } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsList';

export const CoinmarketTransactions = () => {
    const coinmarketBackRouteName = useSelector(
        state => state.wallet.coinmarket.coinmarketBackRouteName,
    );
    const title = coinmarketBackRouteName.includes('wallet-coinmarket-exchange')
        ? 'TR_COINMARKET_SWAP'
        : 'TR_COINMARKET_BUY_AND_SELL';

    return <CoinmarketContainer title={title} SectionComponent={CoinmarketTransactionsList} />;
};
