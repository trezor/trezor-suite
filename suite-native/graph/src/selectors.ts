import { A } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountItem, isIgnoredBalanceHistoryCoin } from '@suite-common/graph';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectFilterKnownTokens,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectDeviceMainnetAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getPortfolioGraphTotalFiatBalance } from './portfolioGraphBalanceUtils';

type GraphCommonRootState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;
type PortfolioGraphRootState = GraphCommonRootState & DiscoveryRootState;
type PortfolioGraphBalanceRootState = DeviceRootState &
    AccountsRootState &
    DiscoveryRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<GraphCommonRootState>();
const createPortfolioGraphBalanceSelector =
    createWeakMapSelector.withTypes<PortfolioGraphBalanceRootState>();

export const selectPortfolioGraphAccountItems = (state: GraphCommonRootState): AccountItem[] => {
    const accounts = selectDeviceMainnetAccounts(state);

    return accounts.map(account => {
        const knownTokens = account.tokens
            ? selectFilterKnownTokens(state, account.symbol, account.tokens)
            : undefined;
        const tokensFilter = knownTokens?.map(token => token.contract as TokenAddress);

        return {
            symbol: account.symbol,
            descriptor: account.descriptor,
            identity: tryGetAccountIdentity(account),
            accountKey: account.key,
            tokensFilter,
        };
    });
};

export const selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning = (
    state: PortfolioGraphRootState,
): AccountItem[] => {
    if (selectHasRunningDiscovery(state)) {
        return returnStableArrayIfEmpty<AccountItem>();
    }

    return selectPortfolioGraphAccountItems(state);
};

// Use a primitive decimal string as the memoization boundary. Recalculating an unchanged balance
// creates a new BigNumber instance, which would trigger useSelector subscribers by reference.
// BigNumber.toFixed() preserves the full decimal value without converting through a JS number.
const selectPortfolioGraphTotalFiatBalanceValue = createPortfolioGraphBalanceSelector(
    [selectDeviceAccounts, selectCurrentFiatRates, selectBaseCurrency, selectHasRunningDiscovery],
    (deviceAccounts, fiatRates, baseCurrencyCode, hasRunningDiscovery) =>
        // Do not return any value before discovery is finished to prevent unnecessary graph rerenders.
        hasRunningDiscovery
            ? undefined
            : getPortfolioGraphTotalFiatBalance({
                  deviceAccounts,
                  fiatRates,
                  baseCurrencyCode,
              }).toFixed(),
);

export const selectPortfolioGraphTotalFiatBalance = createPortfolioGraphBalanceSelector(
    [selectPortfolioGraphTotalFiatBalanceValue],
    totalFiatBalanceValue =>
        totalFiatBalanceValue === undefined
            ? undefined
            : asBaseCurrencyAmount(new BigNumber(totalFiatBalanceValue)),
);

export const selectHasDeviceHistoryEnabledAccounts = createMemoizedSelector(
    [selectDeviceMainnetAccounts],
    (accounts): boolean =>
        A.isNotEmpty(accounts.filter(a => !isIgnoredBalanceHistoryCoin(a.symbol))),
);

export const selectDeviceHistoryIgnoredNetworkSymbols = createMemoizedSelector(
    [selectDeviceMainnetAccounts],
    (accounts): readonly NetworkSymbol[] =>
        A.uniq(accounts.filter(a => isIgnoredBalanceHistoryCoin(a.symbol)).map(a => a.symbol)),
);

export const selectIsHistoryEnabledAccountByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey | undefined,
): boolean => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return false;
    }

    return !isIgnoredBalanceHistoryCoin(account.symbol);
};
