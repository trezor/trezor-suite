import { useSelector } from 'src/hooks/suite';
import { selectRouteName, selectRouter } from 'src/reducers/suite/routerReducer';
import { CoinmarketContainerBackRouteType } from 'src/types/coinmarket/coinmarket';

interface CoinmarketUseRouteHelperProps {
    backRoute?: CoinmarketContainerBackRouteType;
}

export const useCoinmarketRouteHelper = ({ backRoute }: CoinmarketUseRouteHelperProps) => {
    const router = useSelector(selectRouter);
    const currentRouteName = useSelector(selectRouteName);
    const suiteBackRouteName = useSelector(state => state.wallet.coinmarket.suiteBackRouteName);
    const coinmarketBackRouteName = useSelector(
        state => state.wallet.coinmarket.coinmarketBackRouteName,
    );

    const currentBackRouteName = router.settingsBackRoute.name;

    const getNewBackRoute = () => {
        // if backRoute is provided, use it - almost every page
        if (backRoute) return backRoute;

        // fallback when currentRouteName is undefined
        if (!currentRouteName) return currentBackRouteName;

        // coinmarketBackRouteName is set in middleware when user navigates to coinmarket page
        if (currentRouteName === 'wallet-coinmarket-transactions') return coinmarketBackRouteName;

        // suiteBackRouteName is set in middleware when user navigates from suite page to coinmarket page
        return suiteBackRouteName;
    };

    return {
        updatedBackRoute: getNewBackRoute(),
        currentRouteName,
    };
};
