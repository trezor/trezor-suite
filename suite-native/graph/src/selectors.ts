import { A } from '@mobily/ts-belt';

import { AccountItem } from '@suite-common/graph';
import { isIgnoredBalanceHistoryCoin } from '@suite-common/graph/src/constants';
import {
    selectFilterKnownTokens,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import {
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectDeviceMainnetAccounts,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';

type GraphCommonRootState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;

export const selectPortfolioGraphAccountItems = (state: GraphCommonRootState): AccountItem[] => {
    const accounts = selectDeviceMainnetAccounts(state);

    return accounts.map(account => {
        const knownTokens = account.tokens
            ? selectFilterKnownTokens(state, account.symbol, account.tokens)
            : undefined;
        const tokensFilter = knownTokens?.map(token => token.contract as TokenAddress);

        return {
            coin: account.symbol,
            descriptor: account.descriptor,
            identity: tryGetAccountIdentity(account),
            accountKey: account.key,
            tokensFilter,
        };
    });
};

export const selectHasDeviceHistoryEnabledAccounts = (
    state: DeviceRootState & AccountsRootState,
): boolean => {
    const accounts = selectDeviceMainnetAccounts(state);

    return A.isNotEmpty(accounts.filter(a => !isIgnoredBalanceHistoryCoin(a.symbol)));
};

export const selectHasDeviceHistoryIgnoredAccounts = (
    state: DeviceRootState & AccountsRootState,
): boolean => {
    const accounts = selectDeviceMainnetAccounts(state);

    return A.isNotEmpty(accounts.filter(a => isIgnoredBalanceHistoryCoin(a.symbol)));
};

export const selectIsHistoryEnabledAccountByAccountKey = (
    state: AccountsRootState,
    accountKey: string | undefined,
): boolean => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return false;
    }

    return !isIgnoredBalanceHistoryCoin(account.symbol);
};
