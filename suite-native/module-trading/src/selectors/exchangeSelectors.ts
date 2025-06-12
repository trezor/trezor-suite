import { selectTradingExchangeBuyCryptoIds } from '@suite-common/trading';

import { TradingRootState, createMemoizedSelector } from '../tradingSlice';
import {
    coinInfoToTradeableAsset,
    tradeableAssetSortingComparator,
} from '../utils/general/tradeableAssetUtils';

export const selectExchangeTradeableAssetsSorted = createMemoizedSelector(
    [
        selectTradingExchangeBuyCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeBuyCryptoIds>,
        ({ wallet }) => wallet.tradingNew.info.coins,
    ],
    (cryptoIds, coins) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .map(cryptoId => coinInfoToTradeableAsset(cryptoId, coins[cryptoId]))
            .sort(tradeableAssetSortingComparator);
    },
);
