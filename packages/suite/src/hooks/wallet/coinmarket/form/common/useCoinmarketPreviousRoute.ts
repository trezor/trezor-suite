import { useSelector } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { getTradeTypeByRoute } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const useCoinmarketPreviousRoute = (tradeType: CoinmarketTradeType) => {
    const {
        settingsBackRoute: { name: previousRouteName },
    } = useSelector(selectRouter);
    const tradeTypeFromRoute = getTradeTypeByRoute(previousRouteName);
    const isPreviousRouteFromTradeSection = tradeTypeFromRoute === tradeType;

    return isPreviousRouteFromTradeSection;
};
