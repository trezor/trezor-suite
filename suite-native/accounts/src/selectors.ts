import { A, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    TokenDefinitionsRootState,
    selectFilterKnownTokens,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectAccountByKey,
    selectAccounts,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { AccountKey, TokenInfoBranded } from '@suite-common/wallet-types';
import { getAccountFiatBalance, getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { SettingsSliceRootState, selectFiatCurrencyCode } from '@suite-native/settings';
import { isCoinWithTokens } from '@suite-native/tokens';

import { AccountSelectBottomSheetSection, GroupedByTypeAccounts } from './types';
import {
    filterAccountsByLabelAndNetworkNames,
    groupAccountsByNetworkAccountType,
    sortAccountsByNetworksAndAccountTypes,
} from './utils';

export type NativeAccountsRootState = AccountsRootState &
    FiatRatesRootState &
    SettingsSliceRootState &
    DeviceRootState &
    TokenDefinitionsRootState;

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = memoizeWithArgs(
    (state: NativeAccountsRootState, filterValue: string) => {
        const accounts = selectVisibleDeviceAccounts(state);

        return pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedByTypeAccounts;
    },
    // This selector is used only in one search component, so cache size equal to 1 is enough.
    { size: 1 },
);

export const selectIsAccountAlreadyDiscovered = (
    state: AccountsRootState,
    {
        networkSymbol,
        path,
        deviceState,
    }: { networkSymbol: NetworkSymbol; path: string; deviceState: string },
) =>
    pipe(
        state,
        selectAccounts,
        A.any(
            account =>
                account.symbol === networkSymbol &&
                account.path === path &&
                account.deviceState === deviceState,
        ),
    );

export const selectAccountFiatBalance = (state: NativeAccountsRootState, accountKey: string) => {
    const fiatRates = selectCurrentFiatRates(state);
    const account = selectAccountByKey(state, accountKey);
    const localCurrency = selectFiatCurrencyCode(state);

    if (!account) {
        return '0';
    }

    const totalBalance = getAccountFiatBalance({
        account,
        rates: fiatRates,
        localCurrency,
    });

    return totalBalance;
};

const EMPTY_ARRAY: AccountSelectBottomSheetSection[] = [];

export const selectAccountListSections = memoizeWithArgs(
    (state: NativeAccountsRootState, accountKey?: AccountKey | null, hideStaking?: boolean) => {
        if (!accountKey) return EMPTY_ARRAY;
        const account = selectAccountByKey(state, accountKey);
        if (!account) return EMPTY_ARRAY;

        const sections: AccountSelectBottomSheetSection[] = [];

        const canHasTokens = isCoinWithTokens(account.symbol);
        const tokens = selectFilterKnownTokens(state, account.symbol, account.tokens ?? []);
        const hasAnyKnownTokens = canHasTokens && !!tokens.length;
        const stakingBalance = getAccountTotalStakingBalance(account);
        const hasStaking = stakingBalance !== '0' && !hideStaking;

        if (canHasTokens) {
            sections.push({
                type: 'sectionTitle',
                account,
                hasAnyKnownTokens,
            });
        }
        sections.push({
            type: 'account',
            account,
            isLast: !hasAnyKnownTokens && !hasStaking,
            isFirst: true,
            hasAnyKnownTokens,
        });

        if (hasStaking) {
            sections.push({
                type: 'staking',
                account,
                stakingCryptoBalance: stakingBalance,
                isLast: !hasAnyKnownTokens,
            });
        }

        if (hasAnyKnownTokens) {
            tokens.forEach((token, index) => {
                sections.push({
                    type: 'token',
                    account,
                    token: token as TokenInfoBranded,
                    isLast: index === tokens.length - 1,
                });
            });
        }

        return sections;
    },
    // Some reasonable number of accounts that could be in app
    { size: 40 },
);

export const selectFirstUnusedAccountAddress = (
    state: NativeAccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return null;

    return account.addresses?.unused[0]?.address ?? null;
};
