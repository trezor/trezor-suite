import type { ExchangeTrade } from 'invity-api';

import {
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeProviders,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    coinInfoToTradeableAsset,
    getReceiveAccountFromAccountAndAddressString,
} from '@suite-native/trading-atoms';

import {
    type TradingRootState,
    createMemoizedSelectorWithAccounts,
    createTradingWithFeatureFlagsMemoizedSelector,
} from '../reducers';
import { getAssetByEnabledNetworksFilter } from '../utils';

export type TradingWithFeatureFlagsRootState = TradingRootState & FeatureFlagsRootState;

export const selectTradingExchange = (state: TradingRootState) => state.wallet.trading.exchange;

const findAccountByKey = (accounts: Account[], accountKey: string | undefined) => {
    if (!accountKey) return undefined;

    return accounts.find(a => a.key === accountKey);
};

export const selectExchangeSelectedSendAccount = createMemoizedSelectorWithAccounts(
    [selectAccounts, state => selectTradingExchange(state).tradingAccountKey],
    findAccountByKey,
);

export const selectExchangeSelectedReceiveAccount = createMemoizedSelectorWithAccounts(
    [
        selectAccounts,
        state => selectTradingExchange(state).receiveAccountKey,
        state => selectTradingExchange(state).receiveAddress,
    ],
    (accounts, accountKey, receiveAddress) => {
        const account = findAccountByKey(accounts, accountKey);

        return account
            ? getReceiveAccountFromAccountAndAddressString(account, receiveAddress)
            : undefined;
    },
);

export const selectExchangeBuyTradeableAssets = createTradingWithFeatureFlagsMemoizedSelector(
    [
        selectTradingExchangeBuyCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeBuyCryptoIds>,
        ({ wallet }) => wallet.trading.info.coins,
        (_state: TradingRootState, forbiddenCryptoId?: string) => forbiddenCryptoId,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
    ],
    (
        cryptoIds,
        coins,
        forbiddenCryptoId,
        areDebugOnlyNetworksEnabled,
        areExperimentalOnlyNetworksEnabled,
    ) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .filter(cryptoId => cryptoId !== forbiddenCryptoId)
            .map(cryptoId => coinInfoToTradeableAsset(cryptoId, coins[cryptoId]))
            .filter(
                getAssetByEnabledNetworksFilter(
                    areDebugOnlyNetworksEnabled,
                    areExperimentalOnlyNetworksEnabled,
                ),
            );
    },
);

export const selectExchangeQuotes = (state: TradingRootState) =>
    state.wallet.trading.exchange.quotes;

export const selectGroupedExchangeQuotes = createTradingWithFeatureFlagsMemoizedSelector(
    [
        selectExchangeQuotes,
        selectTradingExchangeProviders as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeProviders>,
        (state: TradingWithFeatureFlagsRootState) =>
            selectIsFeatureFlagEnabled(state, FeatureFlag.AreTradingExchangeDexesEnabled),
    ],
    (quotes, providers = {}, areTradingExchangeDexesEnabled) => {
        const groups = {
            fixed: [] as ExchangeTrade[],
            float: [] as ExchangeTrade[],
            dex: [] as ExchangeTrade[],
        };

        quotes.forEach(quote => {
            const { exchange = '', isDex } = quote;
            const { isFixedRate } = providers[exchange] || {};

            if (isDex) {
                if (!areTradingExchangeDexesEnabled) {
                    return;
                }
                groups.dex.push(quote);
            } else if (isFixedRate) {
                groups.fixed.push(quote);
            } else {
                groups.float.push(quote);
            }
        });

        return groups;
    },
);

export const selectExchangeAmountLimits = (state: TradingRootState) =>
    selectTradingExchange(state).amountLimits;
