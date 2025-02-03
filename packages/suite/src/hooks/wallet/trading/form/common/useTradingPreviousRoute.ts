import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import { getTradeTypeByRoute } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingPreviousRoute = (tradeType: TradingType) => {
    const {
        settingsBackRoute: { name: previousRouteName },
    } = useSelector(selectRouter);
    const tradeTypeFromRoute = getTradeTypeByRoute(previousRouteName);
    const isPreviousRouteFromTradeSection = tradeTypeFromRoute === tradeType;

    return isPreviousRouteFromTradeSection;
};
