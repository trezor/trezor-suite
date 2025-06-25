import { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeProviders,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import {
    TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
} from '../reducers';
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

export const selectExchangeQuotes = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.quotes;

export const selectTradingExchangeIsLoading = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.isLoading;

const ratingSortingComparator = (
    a: { rate?: number | undefined },
    b: { rate?: number | undefined },
) => (b.rate ?? 0) - (a.rate ?? 0);

export const selectGroupedExchangeQuotes = createMemoizedSelector(
    [
        selectExchangeQuotes,
        selectTradingExchangeProviders as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeProviders>,
    ],
    (quotes, providers = {}) => {
        const groups = {
            fixed: [] as ExchangeTrade[],
            float: [] as ExchangeTrade[],
            dex: [] as ExchangeTrade[],
        };

        quotes.forEach(quote => {
            const { exchange = '', isDex } = quote;
            const { isFixedRate } = providers[exchange] || {};

            if (isDex) {
                groups.dex.push(quote);
            } else if (isFixedRate) {
                groups.fixed.push(quote);
            } else {
                groups.float.push(quote);
            }
        });

        Object.values(groups).forEach(group => {
            group.sort(ratingSortingComparator);
        });

        return groups;
    },
);
