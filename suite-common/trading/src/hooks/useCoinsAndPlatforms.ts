import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingCoins, selectTradingPlatforms } from '../selectors/tradingSelectors';

export function useCoinsAndPlatforms() {
    const tradingCoins = useSelector(selectTradingCoins);
    const tradingPlatforms = useSelector(selectTradingPlatforms);

    const getCoinsAndPlatforms = useCallback(() => {
        const coins = tradingCoins ?? {};
        const platforms = tradingPlatforms ?? {};

        return { coins, platforms };
    }, [tradingCoins, tradingPlatforms]);

    return getCoinsAndPlatforms;
}
