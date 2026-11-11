import { selectTradingCoins, useTradingCatalogStatus } from '@suite-common/trading';

import { useSelector } from '#src/hooks/suite/useSelector';

const COIN_INFO_CATALOGS = ['info'] as const;

/**
 * Whether the coin info is in the store or its request failed, so waiting longer would not change a form's defaults.
 */
export const useIsTradingCoinInfoSettled = () => {
    const coins = useSelector(selectTradingCoins);
    const { isLoading, lastLoadedTimestamp } = useTradingCatalogStatus(COIN_INFO_CATALOGS);

    // A failed request saves no coins, but its load still ends.
    return !!coins || (lastLoadedTimestamp > 0 && !isLoading);
};
