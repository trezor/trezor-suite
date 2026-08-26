import { type NetworkSymbol } from '@suite-common/networks';
import {
    EMPTY_GROUPED_EXCHANGE_QUOTES_BY_RATE_TYPE,
    type GroupedExchangeQuotesByRateType,
    selectGroupedExchangeQuotes,
    selectTradingExchangeBuyCryptoIds,
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

export type { GroupedExchangeQuotesByRateType };
export { EMPTY_GROUPED_EXCHANGE_QUOTES_BY_RATE_TYPE, selectGroupedExchangeQuotes };

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
        (state: TradingRootState, supportedCoins: readonly NetworkSymbol[]) =>
            selectTradingExchangeBuyCryptoIds(state, supportedCoins),
        ({ wallet }) => wallet.trading.info.coins,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
    ],
    (cryptoIds, coins, areDebugOnlyNetworksEnabled, areExperimentalOnlyNetworksEnabled) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .flatMap(cryptoId => {
                const coinInfo = coins[cryptoId];
                if (!coinInfo) {
                    return [];
                }

                return [coinInfoToTradeableAsset(cryptoId, coinInfo)];
            })
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

export const selectExchangeAmountLimits = (state: TradingRootState) =>
    selectTradingExchange(state).amountLimits;
