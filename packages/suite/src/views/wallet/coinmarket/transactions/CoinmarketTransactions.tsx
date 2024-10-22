import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { useSelector } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import { CoinmarketContainerBackRouteType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketTransactionsList } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsList';

export const CoinmarketTransactions = () => {
    const router = useSelector(selectRouter);
    const backRoute = router.settingsBackRoute.name as CoinmarketContainerBackRouteType;
    const title = router.settingsBackRoute.name.includes('wallet-coinmarket-exchange')
        ? 'TR_COINMARKET_SWAP'
        : 'TR_COINMARKET_BUY_AND_SELL';

    return (
        <CoinmarketContainer
            title={title}
            backRoute={backRoute}
            SectionComponent={CoinmarketTransactionsList}
        />
    );
};
