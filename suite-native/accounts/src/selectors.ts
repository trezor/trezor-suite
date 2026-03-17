import { A, pipe } from '@mobily/ts-belt';

import {
    DeviceRootState,
    selectDeviceStaticSessionId,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { SuiteSyncDataRootState, selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import {
    SimpleTokenStructure,
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    AccountsRootState,
    FiatRatesRootState,
    TransactionsRootState,
    WalletSettingsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsAccountUtxoBased,
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
import { isNetworkWithTokens, selectAccountTokenInfo } from '@suite-native/tokens';

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
    SuiteSyncDataRootState &
    TokenDefinitionsRootState &
    TransactionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeAccountsRootState>();

export const selectVisibleAccountsWithLabel = (state: NativeAccountsRootState) =>
    selectAccountsWithSuiteSyncLabel(
        state,
        selectVisibleDeviceAccounts(state),
        selectDeviceStaticSessionId(state),
    );

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = createMemoizedSelector(
    [
        selectVisibleAccountsWithLabel,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            isSendFilterEnabled: boolean = false,
        ) => isSendFilterEnabled,
    ],
    (accounts, filterValue, isSendFilterEnabled) => {
        const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);
        const sendFilteredAccounts = isSendFilterEnabled
            ? filterSendAvailableAccounts(sortedAccounts)
            : sortedAccounts;

        return pipe(
            sendFilteredAccounts,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedByTypeAccounts;
    },
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
    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);

    // TODO: unify with desktop when token management is ready,
    // unhide token during activation automatically
    // For Stellar, show all tokens without filtering.
    // Unlike EVM chains where tokens can be airdropped as spam, Stellar tokens (trustlines)
    // require explicit user action to activate. See tokensSelectors.ts for details.
    const tokens =
        account.networkType === 'stellar'
            ? (account.tokens ?? [])
            : filterKnownTokens(tokenDefinitions, account.symbol, account.tokens ?? []);

    const tokensWithBalance =
        account.networkType === 'stellar'
            ? tokens
            : tokens.filter(token => parseFloat(token?.balance ?? '0') > 0);
    const hasAnyKnownTokens = isNetworkSupportingTokens && !!tokensWithBalance.length;

    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const hasStakingBalance = stakingBalance !== '0' || isCardanoStakingActive(account);
    const hasStaking = doesCoinSupportStaking(account.symbol) && hasStakingBalance;

    if (isNetworkSupportingTokens) {
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
        // For Stellar, show all tokens (trustlines) regardless of balance since they are explicitly activated
        // For other networks, only show tokens with balance > 0
        const tokensToShow =
            account.networkType === 'stellar'
                ? tokens
                : tokens.filter(token => parseFloat(token?.balance ?? '0') > 0);
        tokensToShow.forEach((token, index) => {
            sections.push({
                type: 'token',
                account,
                token: token as TokenInfoBranded,
                isLast: index === tokensToShow.length - 1,
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
