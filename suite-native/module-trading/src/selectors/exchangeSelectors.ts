import { invariant } from '@suite-common/suite-utils';
import { selectTradingExchangeBuyCryptoIds } from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import {
    TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
} from '../tradingSlice';
import { ReceiveAccount } from '../types/general';
import {
    coinInfoToTradeableAsset,
    tradeableAssetSortingComparator,
} from '../utils/general/tradeableAssetUtils';

export const selectTradingExchange = (state: TradingRootState) => state.wallet.tradingNew.exchange;

export const selectExchangeSelectedReceiveAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingExchange],
    (state, { receiveAddress: address, receiveAccountKey }) => {
        if (!receiveAccountKey) {
            return undefined;
        }

        const account = selectAccountByKey(state, receiveAccountKey);

        invariant(account, `Unknown receiveAccountKey: [${receiveAccountKey}]`);

        return { account, address } as ReceiveAccount;
    },
);

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
