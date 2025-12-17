import { A, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    SimpleTokenStructure,
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    TransactionsRootState,
    WalletSettingsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsAccountUtxoBased,
    selectIsPortfolioTrackerDevice,
    selectPendingAccountAddresses,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, AccountKey, TokenInfoBranded } from '@suite-common/wallet-types';
import {
    BASE_CURRENCY_ZERO,
    getAccountFiatBalance,
    getAccountTotalStakingBalance,
    getFiatRateKey,
    getFirstFreshAddress,
    isCardanoStakingActive,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { doesCoinSupportStaking } from '@suite-native/staking';
import { isCoinWithTokens, selectAccountTokenInfo } from '@suite-native/tokens';

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

export const selectAccountFiatBalance = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectAccountByKey,
        selectBaseCurrency,
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
            return BASE_CURRENCY_ZERO;
        }

        const totalBalance = getAccountFiatBalance({
            account,
            rates: fiatRates,
            baseCurrencyCode: localCurrency,
            shouldIncludeStaking,
            shouldIncludeTokens,
        });

        if (!totalBalance) {
            return BASE_CURRENCY_ZERO;
        }

        return totalBalance;
    },
);

export const selectAccountTokenFiatBalance = createMemoizedSelector(
    [selectCurrentFiatRates, selectBaseCurrency, selectAccountByKey, selectAccountTokenInfo],
    (fiatRates, localCurrency, account, tokenInfo) => {
        if (!account || !fiatRates || !tokenInfo) return BASE_CURRENCY_ZERO;
        const { contract, balance } = tokenInfo;
        const fiatRateKey = getFiatRateKey(account.symbol, localCurrency, contract);
        const rate = fiatRates[fiatRateKey]?.rate;

        if (!rate || !balance) return BASE_CURRENCY_ZERO;

        return toFiatCurrency({ amount: balance, rate }) ?? BASE_CURRENCY_ZERO;
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

    const hasStakingBalance = stakingBalance !== '0' || isCardanoStakingActive(account);
    const hasStaking = doesCoinSupportStaking(account.symbol) && hasStakingBalance;

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
        const tokensWithBalance = tokens.filter(token => parseFloat(token?.balance ?? '0') > 0);
        tokensWithBalance.forEach((token, index) => {
            sections.push({
                type: 'token',
                account,
                token: token as TokenInfoBranded,
                isLast: index === tokensWithBalance.length - 1,
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
