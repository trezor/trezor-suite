import { A, pipe } from '@mobily/ts-belt';

import {
    SimpleTokenStructure,
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    TransactionsRootState,
    selectAccountByKey,
    selectAccounts,
    selectCurrentFiatRates,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, AccountKey, TokenInfoBranded } from '@suite-common/wallet-types';
import {
    getAccountFiatBalance,
    getAccountTotalStakingBalance,
    getFirstFreshAddress,
} from '@suite-common/wallet-utils';
import { SettingsSliceRootState, selectFiatCurrencyCode } from '@suite-native/settings';
import { isCoinWithTokens } from '@suite-native/tokens';
import type { StaticSessionId } from '@trezor/connect';
import { createWeakMapSelector } from '@suite-common/redux-utils';

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

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeAccountsRootState>();

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
    ],
    (accounts, filterValue) => {
        return pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedByTypeAccounts;
    },
);

export const selectIsAccountAlreadyDiscovered = (
    state: AccountsRootState,
    {
        networkSymbol,
        path,
        deviceState,
    }: { networkSymbol: NetworkSymbol; path: string; deviceState: StaticSessionId },
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

export const getAccountListSections = (
    account: Account,
    tokenDefinitions: SimpleTokenStructure | undefined,
    hideStaking?: boolean,
) => {
    const sections: AccountSelectBottomSheetSection[] = [];

    const canHasTokens = isCoinWithTokens(account.symbol);
    const tokens = filterKnownTokens(tokenDefinitions, account.symbol, account.tokens ?? []);
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
};

const EMPTY_ARRAY: AccountSelectBottomSheetSection[] = [];

export const selectAccountListSections = createMemoizedSelector(
    [
        selectAccountByKey,
        selectTokenDefinitions,
        (_state, _accountKey?: AccountKey, hideStaking?: boolean) => hideStaking,
    ],
    (account, tokenDefinitions, hideStaking) => {
        if (!account) return EMPTY_ARRAY;

        const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            account.symbol,
        );

        return getAccountListSections(account, networkTokenDefinitions, hideStaking);
    },
);

export const selectFreshAccountAddress = (
    state: NativeAccountsRootState & TransactionsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) return null;

    const pendingAddresses = selectPendingAccountAddresses(state, accountKey);

    const isAccountUtxoBased = selectIsAccountUtxoBased(state, accountKey);

    return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
};
