import { CoinmarketAccountTransactions } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { useSelector } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import { CoinmarketContainerBackRouteType } from 'src/types/coinmarket/coinmarket';

export const CoinmarketTransactions = () => {
    const router = useSelector(selectRouter);
    const backRoute = router.settingsBackRoute.name as CoinmarketContainerBackRouteType;

    return (
        <CoinmarketContainer
            title="TR_COINMARKET_LAST_TRANSACTIONS"
            backRoute={backRoute}
            SectionComponent={CoinmarketAccountTransactions}
        />
    );
};
