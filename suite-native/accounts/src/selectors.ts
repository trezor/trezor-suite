import { A, pipe } from '@mobily/ts-belt';

import { getFirstFreshAddress } from '@suite-common/address';
import { type DeviceRootState, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    selectSuiteSyncAccountLabel,
    selectVisibleDeviceAccountsWithSuiteSyncLabel,
} from '@suite-common/suite-sync';
import {
    type SimpleTokenStructure,
    type TokenDefinitionsRootState,
    getSimpleCoinDefinitionsByNetwork,
    isTokenDefinitionKnown,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountDefiTokensCount,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountDescriptor,
    type AccountKey,
    type RatesByKey,
    type TokenAddress,
    type TokenInfoBranded,
    asBaseCurrencyAmount,
    createAccountKey,
} from '@suite-common/wallet-types';
import {
    BASE_CURRENCY_ZERO,
    getAccountFiatBalance,
    getAccountTotalStakingBalance,
    getFiatRateKey,
    isAccountFailed,
    isCardanoStakingActive,
    isErc4626,
    isStakingSymbol,
    sortTokensByName,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type CombinedLabelingState, selectIsLabellingAllowed } from '@suite-native/labeling';
import { isNetworkWithTokens, selectAccountTokenInfo } from '@suite-native/tokens';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountListSection } from './types';
import {
    filterAccountsByLabelAndNetworkNames,
    filterAccountsByNetworkSymbols,
    filterSendAvailableAccounts,
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

export const selectAccountLabel = (
    state: CombinedLabelingState,
    deviceStaticSessionId: StaticSessionId,
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => {
    const isLabellingAllowed = selectIsLabellingAllowed(state);

    const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);

    const syncedLabel = selectSuiteSyncAccountLabel(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    );

    if (isLabellingAllowed && syncedLabel) {
        return syncedLabel;
    }

    // Fallback to legacy account.label (mobile only, portfolio tracker)

    const accountKey = createAccountKey({
        accountDescriptor,
        networkSymbol,
        deviceStaticSessionId,
    });

    const account = selectAccountByKey(state, accountKey);

    return account?.accountLabel ?? null;
};

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
const selectFilteredDeviceAccounts = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsWithSuiteSyncLabel,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
        (_state: NativeAccountsRootState, _filterValue: string, isSendFlow: boolean = false) =>
            isSendFlow,
    ],
    (accounts, filterValue, isSendFlow) => {
        const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);
        const sendFilteredAccounts = isSendFlow
            ? filterSendAvailableAccounts(sortedAccounts)
            : sortedAccounts;

        return filterAccountsByLabelAndNetworkNames(sendFilteredAccounts, filterValue);
    },
);

const createStableArray = weakMapMemoize(<T>(...items: T[]) => items);

export const selectFilteredDeviceNetworkSymbols = createMemoizedSelector(
    [
        selectFilteredDeviceAccounts,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            _isSendFlow: boolean = false,
            networkSymbols: NetworkSymbol[],
        ) => networkSymbols,
    ],
    (accounts, networkSymbols) => {
        const networkFilteredAccounts = filterAccountsByNetworkSymbols(accounts, networkSymbols);

        return returnStableArrayIfEmpty(
            createStableArray(...A.uniq(networkFilteredAccounts.map(account => account.symbol))),
        );
    },
);

export const selectFilteredDeviceAccountTypesByNetworkSymbol = createMemoizedSelector(
    [
        selectFilteredDeviceAccounts,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            _isSendFlow: boolean = false,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
    ],
    (accounts, networkSymbol) =>
        returnStableArrayIfEmpty(
            createStableArray(
                ...A.uniq(
                    accounts
                        .filter(account => account.symbol === networkSymbol)
                        .map(account => account.accountType),
                ),
            ),
        ),
);

export const selectFilteredDeviceAccountsByNetworkSymbolAndAccountType = createMemoizedSelector(
    [
        selectFilteredDeviceAccounts,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            _isSendFlow: boolean = false,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            _isSendFlow: boolean = false,
            _networkSymbol: NetworkSymbol,
            accountType: AccountType,
        ) => accountType,
    ],
    (accounts, networkSymbol, accountType) =>
        returnStableArrayIfEmpty(
            createStableArray(
                ...accounts.filter(
                    account =>
                        account.symbol === networkSymbol && account.accountType === accountType,
                ),
            ),
        ),
);

export type NetworkFilterOption = {
    symbol: NetworkSymbol;
    accountCount: number;
};

const createNetworkFilterOption = weakMapMemoize(
    (symbol: NetworkSymbol, accountCount: number): NetworkFilterOption => ({
        symbol,
        accountCount,
    }),
);

export const selectNetworkFilterOptions = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsWithSuiteSyncLabel,
        (_state: NativeAccountsRootState, isSendFlow: boolean = false) => isSendFlow,
    ],
    (accounts, isSendFlow) => {
        const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);
        const filteredAccounts = isSendFlow
            ? filterSendAvailableAccounts(sortedAccounts)
            : sortedAccounts;

        const accountCounts = new Map<NetworkSymbol, number>();

        for (const account of filteredAccounts) {
            accountCounts.set(account.symbol, (accountCounts.get(account.symbol) ?? 0) + 1);
        }

        return returnStableArrayIfEmpty(
            createStableArray(
                ...Array.from(accountCounts, ([symbol, accountCount]) =>
                    createNetworkFilterOption(symbol, accountCount),
                ),
            ),
        );
    },
);

export const selectIsAccountsListNetworkFilterVisible = createMemoizedSelector(
    [selectNetworkFilterOptions],
    networkFilterOptions => networkFilterOptions.length > 1,
);

const selectAccountFiatBalanceValue = createMemoizedSelector(
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
            return BASE_CURRENCY_ZERO.toFixed();
        }

        const totalBalance = getAccountFiatBalance({
            account,
            rates: fiatRates,
            baseCurrencyCode: localCurrency,
            shouldIncludeStaking,
            shouldIncludeTokens,
        });

        if (!totalBalance) {
            return BASE_CURRENCY_ZERO.toFixed();
        }

        return totalBalance.toFixed();
    },
);

export const selectAccountFiatBalance = createMemoizedSelector(
    [selectAccountFiatBalanceValue],
    fiatBalance => asBaseCurrencyAmount(new BigNumber(fiatBalance)),
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
    groupZeroBalance = false,
    hiddenContracts: string[] = [],
    shownContracts: string[] = [],
    fiatRates?: RatesByKey,
    localCurrency?: ReturnType<typeof selectBaseCurrency>,
) => {
    const sections: AccountListSection[] = [];
    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);

    const hiddenSet = new Set(hiddenContracts.map(c => c.toLowerCase()));
    const shownSet = new Set(shownContracts.map(c => c.toLowerCase()));
    const tokens =
        account.networkType === 'stellar'
            ? (account.tokens ?? []).filter(token => !hiddenSet.has(token.contract.toLowerCase()))
            : (account.tokens ?? [])
                  .filter(
                      token =>
                          isTokenDefinitionKnown(
                              tokenDefinitions,
                              account.symbol,
                              token.contract,
                          ) || shownSet.has(token.contract.toLowerCase()),
                  )
                  .filter(token => !hiddenSet.has(token.contract.toLowerCase()));

    const tokensWithBalance = tokens.filter(token => parseFloat(token?.balance ?? '0') > 0);

    const zeroBalanceTokens: TokenInfoBranded[] = groupZeroBalance
        ? (tokens
              .filter(token => parseFloat(token?.balance ?? '0') === 0)
              .filter(token => !isErc4626(token)) as TokenInfoBranded[])
        : [];

    const hasAnyKnownTokens =
        isNetworkSupportingTokens && !!(tokensWithBalance.length + zeroBalanceTokens.length);

    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const hasStakingBalance = stakingBalance !== '0' || isCardanoStakingActive(account);
    const hasStaking = isStakingSymbol(account.symbol) && hasStakingBalance;

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
        const getTokenFiatValue = (token: { contract: string; balance?: string }): number => {
            if (!fiatRates || !localCurrency) return 0;
            const fiatRateKey = getFiatRateKey(
                account.symbol,
                localCurrency,
                token.contract as TokenAddress,
            );
            const rate = fiatRates[fiatRateKey]?.rate;
            if (!rate || !token.balance) return 0;

            return toFiatCurrency({ amount: token.balance, rate })?.toNumber() ?? 0;
        };

        const tokensToShow = tokensWithBalance
            .filter(token => !isErc4626(token))
            .sort((a, b) => getTokenFiatValue(b) - getTokenFiatValue(a));
        tokensToShow.forEach((token, index) => {
            sections.push({
                type: 'token',
                account,
                token: token as TokenInfoBranded,
                isLast: index === tokensToShow.length - 1 && zeroBalanceTokens.length === 0,
            });
        });

        if (zeroBalanceTokens.length > 0) {
            sections.push({
                type: 'zeroBalance',
                account,
                tokens: [...zeroBalanceTokens].sort(sortTokensByName),
            });
        }
    }

    return sections;
};

const EMPTY_ARRAY: AccountListSection[] = [];

export const selectAccountListSectionsWithZeroBalanceGroup = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions, selectCurrentFiatRates, selectBaseCurrency],
    (account, tokenDefinitions, fiatRates, localCurrency) => {
        if (!account) return EMPTY_ARRAY;

        const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            account.symbol,
        );
        const coinDefs = tokenDefinitions[account.symbol]?.coin;

        return getAccountListSections(
            account,
            networkTokenDefinitions,
            true,
            coinDefs?.hide ?? [],
            coinDefs?.show ?? [],
            fiatRates,
            localCurrency,
        );
    },
);

export const selectActiveAndDefiTokensCount = createMemoizedSelector(
    [selectAccountListSectionsWithZeroBalanceGroup, selectAccountDefiTokensCount],
    (sections, defiCount) => sections.filter(item => item.type === 'token').length + defiCount,
);

export const selectFreshAccountAddress = createMemoizedSelector(
    [selectAccountByKey, selectPendingAccountAddresses, selectIsAccountUtxoBased],
    (account, pendingAddresses, isAccountUtxoBased) =>
        account ? getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased) : null,
);

export const selectIsAccountDiscoveryFailed = createMemoizedSelector(
    [selectAccountByKey],
    account => !!account && isAccountFailed(account),
);

export const selectHasDeviceAnyFailedAccountForNetworkSymbol = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        (_state: NativeAccountsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (accounts, networkSymbol) =>
        accounts.some(account => account.symbol === networkSymbol && isAccountFailed(account)),
);

export const selectHasDeviceAnySendAvailableAccount = createMemoizedSelector(
    [selectIsPortfolioTrackerDevice, selectVisibleDeviceAccounts],
    (isPortfolioTrackerDevice, accounts) => {
        if (isPortfolioTrackerDevice) return false;

        return pipe(accounts, filterSendAvailableAccounts, A.isNotEmpty);
    },
);
