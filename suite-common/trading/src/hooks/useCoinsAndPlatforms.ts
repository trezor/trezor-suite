import { useCallback } from 'react';

import { useFreshRef } from '@trezor/react-utils';

import { useSelector } from './useSelector';
import { selectTradingInfo } from '../selectors/tradingSelectors';

export function useCoinsAndPlatforms() {
    const info = useSelector(selectTradingInfo);

    // Prevent unnecessary re-renders
    const infoRef = useFreshRef(info);

    const getCoinsAndPlatforms = useCallback(() => {
        const coins = infoRef.current.coins ?? {};
        const platforms = infoRef.current.platforms ?? {};

        return { coins, platforms };
    }, [infoRef]);

    return getCoinsAndPlatforms;
}
