import { A } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountItem, isIgnoredBalanceHistoryCoin } from '@suite-common/graph';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    isTokenDefinitionKnown,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectDeviceMainnetAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';

type GraphCommonRootState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;

export const createMemoizedSelector = createWeakMapSelector.withTypes<GraphCommonRootState>();

export const selectPortfolioGraphAccountItems = createMemoizedSelector(
    [selectDeviceMainnetAccounts, (state: GraphCommonRootState) => state.tokenDefinitions],
    (accounts, tokenDefinitions): AccountItem[] =>
        accounts.map(account => {
            let tokensFilter: TokenAddress[] | undefined;
            if (account.tokens) {
                const coinDefinitions = tokenDefinitions?.[account.symbol]?.coin?.data;
                tokensFilter = account.tokens
                    .filter(token =>
                        isTokenDefinitionKnown(coinDefinitions, account.symbol, token.contract),
                    )
                    .map(token => token.contract as TokenAddress);
            }

            return {
                symbol: account.symbol,
                descriptor: account.descriptor,
                identity: tryGetAccountIdentity(account),
                accountKey: account.key,
                tokensFilter,
            };
        }),
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
