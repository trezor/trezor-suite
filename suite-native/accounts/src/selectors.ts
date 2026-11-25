import { A, pipe } from '@mobily/ts-belt';

import { getFirstFreshAddress } from '@suite-common/address';
import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { type StakingRootState } from '@suite-common/earn-staking';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type SuiteSyncDataRootState,
    selectAccountsWithSuiteSyncLabel,
    selectSuiteSyncAccountLabel,
} from '@suite-common/suite-sync';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountTokens,
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
    areBaseCurrencyAmountsEqual,
    createAccountKey,
} from '@suite-common/wallet-types';
import {
    BASE_CURRENCY_ZERO,
    getFiatRateKey,
    isAccountFailed,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { selectDiscoverySupportedNetworks } from '@suite-native/discovery';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type CombinedLabelingState, selectIsLabellingAllowed } from '@suite-native/labeling';
import type { SettingsSliceRootState } from '@suite-native/settings';
import { selectAccountTokenInfo } from '@suite-native/tokens';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';

import { type NetworkFilterType } from './types';
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
    TransactionsRootState &
    StakingRootState;

export type NativeAccountsWithNetworksRootState = NativeAccountsRootState &
    NetworksRootState &
    SettingsSliceRootState &
    FeatureFlagsRootState;

const createNetworkMemoizedSelector =
    createWeakMapSelector.withTypes<NativeAccountsWithNetworksRootState>();

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeAccountsRootState>();

const selectVisibleAccountsWithSuiteSyncLabel = (state: NativeAccountsRootState) =>
    selectAccountsWithSuiteSyncLabel(
        state,
        selectVisibleDeviceAccounts(state),
        selectDeviceStaticSessionId(state),
    );

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
const selectFilteredDeviceAccounts = createNetworkMemoizedSelector(
    [
        selectVisibleAccountsWithSuiteSyncLabel,
        selectSupportedNetworkSymbols,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
        (_state: NativeAccountsRootState, _filterValue: string, isSendFlow: boolean = false) =>
            isSendFlow,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            _isSendFlow: boolean = false,
            _networkSymbols: NetworkSymbol[] = [],
            tokenContract?: TokenAddress,
        ) => tokenContract,
    ],
    (accounts, supportedNetworks, filterValue, isSendFlow, tokenContract) => {
        const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts, supportedNetworks);
        const sendFilteredAccounts = isSendFlow
            ? filterSendAvailableAccounts(sortedAccounts, tokenContract)
            : sortedAccounts;

        return filterAccountsByLabelAndNetworkNames(sendFilteredAccounts, filterValue);
    },
);

const createStableArray = weakMapMemoize(<T>(...items: T[]) => items);

export type FilteredDeviceAccountListRow = {
    accountKey: AccountKey;
    isFirst: boolean;
    isLast: boolean;
};

const isSameAccountGroup = (
    firstAccount: Account | undefined,
    secondAccount: Account | undefined,
) =>
    firstAccount?.symbol === secondAccount?.symbol &&
    firstAccount?.accountType === secondAccount?.accountType;

const createFilteredDeviceAccountListRow = weakMapMemoize(
    (accountKey: AccountKey, isFirst: boolean, isLast: boolean): FilteredDeviceAccountListRow => ({
        accountKey,
        isFirst,
        isLast,
    }),
);

export const selectFilteredDeviceAccountListRows = createNetworkMemoizedSelector(
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
        const filteredAccounts = filterAccountsByNetworkSymbols(accounts, networkSymbols);

        return returnStableArrayIfEmpty(
            createStableArray(
                ...filteredAccounts.map((account, index) =>
                    createFilteredDeviceAccountListRow(
                        account.key,
                        !isSameAccountGroup(filteredAccounts[index - 1], account),
                        !isSameAccountGroup(account, filteredAccounts[index + 1]),
                    ),
                ),
            ),
        );
    },
);

export type NetworkFilterOption = {
    symbol: NetworkSymbol;
    accountCount?: number;
};

const createNetworkFilterOption = weakMapMemoize(
    (symbol: NetworkSymbol, accountCount?: number): NetworkFilterOption => ({
        symbol,
        accountCount,
    }),
);

export const selectNetworkFilterOptions = createNetworkMemoizedSelector(
    [
        selectVisibleAccountsWithSuiteSyncLabel,
        selectDiscoverySupportedNetworks,
        (_state: NativeAccountsRootState, type: NetworkFilterType) => type,
    ],
    (accounts, supportedNetworks, type) => {
        const filteredAccounts = type === 'send' ? filterSendAvailableAccounts(accounts) : accounts;

        const accountCounts = new Map<NetworkSymbol, number>();
        for (const { symbol } of filteredAccounts) {
            accountCounts.set(symbol, (accountCounts.get(symbol) ?? 0) + 1);
        }

        return createStableArray(
            ...supportedNetworks
                .filter(({ symbol }) => accountCounts.has(symbol) || type === 'all')
                .map(({ symbol }) => createNetworkFilterOption(symbol, accountCounts.get(symbol))),
        );
    },
);

export const selectIsAccountsListNetworkFilterVisible = createNetworkMemoizedSelector(
    [selectNetworkFilterOptions],
    networkFilterOptions => networkFilterOptions.length > 1,
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
    {
        memoizeOptions: {
            // Accounts and fiat rates churn on every sync; keep the previous BigNumber reference
            // when the amount is unchanged so useSelector consumers don't rerender.
            resultEqualityCheck: areBaseCurrencyAmountsEqual,
        },
    },
);

export const selectAccountVisibleTokensCount = createMemoizedSelector(
    [selectAccountTokens],
    tokenCategories => tokenCategories?.shownWithBalance.length ?? 0,
);

export const selectAccountHasAnyKnownTokens = createMemoizedSelector(
    [selectAccountVisibleTokensCount],
    numberOfTokens => numberOfTokens > 0,
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
