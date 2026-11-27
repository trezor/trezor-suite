import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingCoins, selectTradingInfo } from '../selectors/tradingSelectors';

export function useCoinsAndPlatforms() {
    const info = useSelector(selectTradingInfo);
    const tradingCoins = useSelector(selectTradingCoins);

    const getCoinsAndPlatforms = useCallback(() => {
        const coins = tradingCoins ?? {};
        const platforms = info.platforms ?? {};

        return { coins, platforms };
    }, [info, tradingCoins]);

    return getCoinsAndPlatforms;
}
