import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingInfo } from '../selectors/tradingSelectors';

export function useCoinsAndPlatforms() {
    const info = useSelector(selectTradingInfo);

    const getCoinsAndPlatforms = useCallback(() => {
        const coins = info.coins ?? {};
        const platforms = info.platforms ?? {};

        return { coins, platforms };
    }, [info]);

    return getCoinsAndPlatforms;
}
