import { ExchangeTrade } from 'invity-api';

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

export const selectTradingExchange = (state: TradingRootState) => state.wallet.trading.exchange;

export const selectExchangeSelectedSendAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingExchange],
    (state, { tradingAccountKey }) => selectAccountByKey(state, tradingAccountKey) || undefined,
);

export const selectExchangeSelectedReceiveAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingExchange],
    (state, { receiveAddress: address, receiveAccountKey }) => {
        const account = selectAccountByKey(state, receiveAccountKey);

        return account ? ({ account, address } as ReceiveAccount) : undefined;
    },
);

export const selectExchangeBuyTradeableAssetsSorted = createMemoizedSelector(
    [
        selectTradingExchangeBuyCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeBuyCryptoIds>,
        ({ wallet }) => wallet.trading.info.coins,
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
    state.wallet.trading.exchange.quotes;

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

export const selectExchangeAmountLimits = (state: TradingRootState) =>
    selectTradingExchange(state).amountLimits;
