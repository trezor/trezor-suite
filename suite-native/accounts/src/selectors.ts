import { A, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    SimpleTokenStructure,
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    TransactionsRootState,
    WalletSettingsRootState,
    selectAccountByKey,
    selectAccounts,
    selectCurrentFiatRates,
    selectIsAccountUtxoBased,
    selectIsPortfolioTrackerDevice,
    selectLocalCurrency,
    selectPendingAccountAddresses,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, AccountKey, TokenInfoBranded } from '@suite-common/wallet-types';
import {
    getAccountFiatBalance,
    getAccountTotalStakingBalance,
    getFiatRateKey,
    getFirstFreshAddress,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { doesCoinSupportStaking } from '@suite-native/staking';
import { isCoinWithTokens, selectAccountTokenInfo } from '@suite-native/tokens';
import type { StaticSessionId } from '@trezor/connect';

import { AccountSelectBottomSheetSection, GroupedByTypeAccounts } from './types';
import {
    filterAccountsByLabelAndNetworkNames,
    filterSendAvailableAccounts,
    groupAccountsByNetworkAccountType,
    sortAccountsByNetworksAndAccountTypes,
} from './utils';

export type NativeAccountsRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    TransactionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeAccountsRootState>();

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            isSendFilterEnabled: boolean = false,
        ) => isSendFilterEnabled,
    ],
    (accounts, filterValue, isSendFilterEnabled) =>
        pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            isSendFilterEnabled ? filterSendAvailableAccounts : accountsSorted => accountsSorted,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedByTypeAccounts,
);

export const selectIsAccountAlreadyDiscovered = (
    state: AccountsRootState,
    {
        symbol,
        path,
        deviceState,
    }: { symbol: NetworkSymbol; path: string; deviceState: StaticSessionId },
) =>
    pipe(
        state,
        selectAccounts,
        A.any(
            account =>
                account.symbol === symbol &&
                account.path === path &&
                account.deviceState === deviceState,
        ),
    );

export const selectAccountFiatBalance = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectAccountByKey,
        selectLocalCurrency,
        (_, _accountKey: AccountKey, shouldIncludeStaking?: boolean) =>
            shouldIncludeStaking ?? true,
        (
            _,
            _accountKey: AccountKey,
            _shouldIncludeStaking?: boolean,
            shouldIncludeTokens?: boolean,
        ) => shouldIncludeTokens ?? true,
    ],
    (fiatRates, account, localCurrency, shouldIncludeStaking, shouldIncludeTokens) => {
        if (!account) {
            return '0';
        }

        const totalBalance = getAccountFiatBalance({
            account,
            rates: fiatRates,
            localCurrency,
            shouldIncludeStaking,
            shouldIncludeTokens,
        });

        if (!totalBalance) {
            return '0';
        }

        return totalBalance;
    },
);

export const selectAccountTokenFiatBalance = createMemoizedSelector(
    [selectCurrentFiatRates, selectLocalCurrency, selectAccountByKey, selectAccountTokenInfo],
    (fiatRates, localCurrency, account, tokenInfo) => {
        if (!account || !fiatRates || !tokenInfo) return '0';
        const { contract, balance } = tokenInfo;
        const fiatRateKey = getFiatRateKey(account.symbol, localCurrency, contract);
        const rate = fiatRates[fiatRateKey]?.rate;

        if (!rate || !balance) return '0';

        return toFiatCurrency(balance, rate) ?? '0';
    },
);

export const getAccountListSections = (
    account: Account,
    tokenDefinitions: SimpleTokenStructure | undefined,
) => {
    const sections: AccountSelectBottomSheetSection[] = [];
    const canHasTokens = isCoinWithTokens(account.symbol);

    const tokens = filterKnownTokens(tokenDefinitions, account.symbol, account.tokens ?? []);
    const hasAnyKnownTokens = canHasTokens && !!tokens.length;
    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';
    const hasStaking = doesCoinSupportStaking(account.symbol) && stakingBalance !== '0';

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
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions) => {
        if (!account) return EMPTY_ARRAY;

        const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            account.symbol,
        );

        return getAccountListSections(account, networkTokenDefinitions);
    },
);

export const selectFreshAccountAddress = createMemoizedSelector(
    [selectAccountByKey, selectPendingAccountAddresses, selectIsAccountUtxoBased],
    (account, pendingAddresses, isAccountUtxoBased) =>
        account ? getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased) : null,
);

export const selectHasDeviceAnySendAvailableAccount = createMemoizedSelector(
    [selectIsPortfolioTrackerDevice, selectVisibleDeviceAccounts],
    (isPortfolioTrackerDevice, accounts) => {
        if (isPortfolioTrackerDevice) return false;

        return pipe(accounts, filterSendAvailableAccounts, A.isNotEmpty);
    },
);
