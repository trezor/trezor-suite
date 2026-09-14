import type { NetworksRootState } from '@suite-common/networks';
import { selectNetworkConfigAccessors } from '@suite-common/networks';
import { A } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountItem, isIgnoredBalanceHistoryCoin } from '@suite-common/graph';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    filterKnownTokens,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    selectAccountByKey,
    selectDeviceMainnetAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { deepEqual } from '@trezor/utils';

type GraphCommonRootState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;
type PortfolioGraphRootState = GraphCommonRootState & DiscoveryRootState;

export const selectPortfolioGraphAccountItems = createWeakMapSelector(
    [selectNetworkConfigAccessors, selectDeviceMainnetAccounts, selectTokenDefinitions],
    (networkConfigDeps, accounts, tokenDefinitions): AccountItem[] =>
        returnStableArrayIfEmpty(
            accounts
                .filter(account => !account.failed)
                .map(account => {
                    const knownTokens = account.tokens
                        ? filterKnownTokens(
                              networkConfigDeps,
                              tokenDefinitions?.[account.symbol]?.coin?.data,
                              account.symbol,
                              account.tokens,
                          )
                        : undefined;
                    const tokensFilter = knownTokens?.map(token => token.contract as TokenAddress);

                    return {
                        symbol: account.symbol,
                        descriptor: account.descriptor,
                        identity: tryGetAccountIdentity(account),
                        accountKey: account.key,
                        tokensFilter,
                    };
                }),
        ),
    {
        memoizeOptions: {
            // Account objects churn on every blockchain sync, but the derived items contain only
            // fields that rarely change. deepEqual keeps the previous array reference when nothing
            // relevant changed, so graph consumers don't rerender or refetch on balance updates.
            resultEqualityCheck: deepEqual,
        },
    },
);

export const selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning = (
    state: PortfolioGraphRootState & NetworksRootState,
): AccountItem[] => {
    if (selectHasRunningDiscovery(state)) {
        return returnStableArrayIfEmpty<AccountItem>();
    }

    return selectPortfolioGraphAccountItems(state);
};

export const selectHasPortfolioGraphAccounts = (
    state: PortfolioGraphRootState & NetworksRootState,
): boolean => A.isNotEmpty(selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning(state));

export const selectHasDeviceHistoryEnabledAccounts = createWeakMapSelector(
    [selectDeviceMainnetAccounts],
    (accounts): boolean =>
        A.isNotEmpty(accounts.filter(a => !isIgnoredBalanceHistoryCoin(a.symbol))),
);

export const selectDeviceHistoryIgnoredNetworkSymbols = createWeakMapSelector(
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
