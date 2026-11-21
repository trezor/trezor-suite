import {
    type StakingAccessRootState,
    type StakingFiatRootState,
    type StakingPromoRootState,
    formatStakingAmount,
    selectDeviceActiveStakingPositionEntries,
    selectIsStakingOperationDisabled,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountAmount,
    selectStakingPromoProductDescriptors,
} from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    createStableFiatRateKeys,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    selectDeviceSupportedNetworks,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsMap,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type RatesByKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet, toFiatCurrency } from '@suite-common/wallet-utils';
import {
    createWeakMapSelector,
    lruMemoize,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type EarnStakingTableRootState = StakingFiatRootState &
    StakingAccessRootState &
    StakingPromoRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<EarnStakingTableRootState>();

const createStableAccounts = weakMapMemoize((...accounts: Account[]) => accounts);

const createStableSymbols = weakMapMemoize((...symbols: NetworkSymbol[]) => symbols);

// Keeps the previous map while its content, the keys and amounts as strings in order, is the same.
// Only the previous one: a weak map holds strings strongly, and every price tick makes new ones.
const createStableFiatAmounts = lruMemoize(
    (...keysAndAmounts: string[]): Partial<Record<AccountKey, string>> => {
        const amounts: Partial<Record<AccountKey, string>> = {};

        for (let index = 0; index < keysAndAmounts.length; index += 2) {
            amounts[keysAndAmounts[index] as AccountKey] = keysAndAmounts[index + 1];
        }

        return amounts;
    },
);

const selectState = (state: EarnStakingTableRootState) => state;

// The table advertises mainnet products only, whatever the testnets setting.
const selectEarnStakingPromoDescriptors = (state: EarnStakingTableRootState) =>
    selectStakingPromoProductDescriptors(state, false);

const hasDashboardMinimum = (state: EarnStakingTableRootState, account: Account): boolean => {
    const limits = selectStakeableStakingProductDescriptorBySymbol(state, account.symbol)?.limits;

    return (
        limits !== undefined &&
        new BigNumber(account.availableBalance).gte(limits.minStakeAmountForDashboard)
    );
};

// The table lists an active mainnet position, as the account menu counts it, so a Tron account that
// holds unclaimed rewards alone is a staked row; a testnet position still counts in the Earn header.
// One row stands for an account, however many products it holds a position in.
export const selectEarnStakingStakedAccounts = createMemoizedSelector(
    [selectDeviceActiveStakingPositionEntries, selectVisibleDeviceAccountsMap],
    (entries, accountsByKey): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(
                ...new Set(
                    entries.flatMap(({ accountKey, descriptor }) => {
                        const account = accountsByKey.get(accountKey);

                        if (account === undefined) return [];
                        if (isTestnet(descriptor.networkSymbol)) return [];

                        return [account];
                    }),
                ),
            ),
        ),
);

const selectEarnStakingCandidateAccounts = createMemoizedSelector(
    [selectState, selectVisibleDeviceAccounts, selectEarnStakingStakedAccounts],
    (state, accounts, stakedAccounts): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(
                ...accounts.filter(
                    account =>
                        !stakedAccounts.includes(account) &&
                        !isTestnet(account.symbol) &&
                        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol) !==
                            null,
                ),
            ),
        ),
);

export const selectEarnStakingStakeableAccounts = createMemoizedSelector(
    [selectState, selectEarnStakingCandidateAccounts],
    (state, accounts): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(
                ...accounts.filter(account => hasDashboardMinimum(state, account)),
            ),
        ),
);

export const selectEarnStakingUnderfundedAccounts = createMemoizedSelector(
    [selectState, selectEarnStakingCandidateAccounts],
    (state, accounts): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(
                ...accounts.filter(account => !hasDashboardMinimum(state, account)),
            ),
        ),
);

// A network the device supports and has no account on gets an activate row, unless its stake is
// switched off.
export const selectEarnStakingActivateSymbols = createMemoizedSelector(
    [
        selectState,
        selectEarnStakingPromoDescriptors,
        selectDeviceSupportedNetworks,
        selectVisibleDeviceAccounts,
    ],
    (state, descriptors, supportedNetworks, accounts): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            createStableSymbols(
                ...new Set(
                    descriptors
                        .filter(
                            ({ id, networkSymbol }) =>
                                supportedNetworks.includes(networkSymbol) &&
                                !accounts.some(account => account.symbol === networkSymbol) &&
                                !selectIsStakingOperationDisabled(state, id, 'stake'),
                        )
                        .map(({ networkSymbol }) => networkSymbol),
                ),
            ),
        ),
);

export const selectEarnStakingAvailableCount = createMemoizedSelector(
    [selectEarnStakingPromoDescriptors, selectDeviceSupportedNetworks, selectVisibleDeviceAccounts],
    (descriptors, supportedNetworks, accounts): number =>
        new Set(
            descriptors
                .map(({ networkSymbol }) => networkSymbol)
                .filter(
                    networkSymbol =>
                        supportedNetworks.includes(networkSymbol) ||
                        accounts.some(account => account.symbol === networkSymbol),
                ),
        ).size,
);

const selectEarnStakingFiatRateKeys = createMemoizedSelector(
    [selectEarnStakingStakedAccounts, selectEarnStakingCandidateAccounts, selectBaseCurrency],
    (stakedAccounts, candidateAccounts, baseCurrency) =>
        createStableFiatRateKeys(
            ...new Set(
                [...stakedAccounts, ...candidateAccounts].map(({ symbol }) =>
                    getFiatRateKey(symbol, baseCurrency),
                ),
            ),
        ),
);

const selectEarnStakingCurrentFiatRates = (state: EarnStakingTableRootState) =>
    selectCurrentFiatRatesByFiatRateKeys(state, selectEarnStakingFiatRateKeys(state));

const toFiatAmount = (
    amount: string,
    account: Account,
    currentFiatRates: RatesByKey,
    baseCurrency: ReturnType<typeof selectBaseCurrency>,
): string =>
    toFiatCurrency({
        amount,
        rate: currentFiatRates[getFiatRateKey(account.symbol, baseCurrency)]?.rate,
    })?.toString() ?? '0';

// What each row sorts by: the fiat value of the stake, or of the balance that could be staked.
export const selectEarnStakingFiatAmountsByAccountKey = createMemoizedSelector(
    [
        selectState,
        selectEarnStakingStakedAccounts,
        selectEarnStakingCandidateAccounts,
        selectEarnStakingCurrentFiatRates,
        selectBaseCurrency,
    ],
    (
        state,
        stakedAccounts,
        candidateAccounts,
        currentFiatRates,
        baseCurrency,
    ): Partial<Record<AccountKey, string>> =>
        createStableFiatAmounts(
            ...stakedAccounts.flatMap(account => [
                account.key,
                toFiatAmount(
                    formatStakingAmount({
                        amount: selectStakingAccountAmount(state, account.key),
                        networkSymbol: account.symbol,
                    }),
                    account,
                    currentFiatRates,
                    baseCurrency,
                ),
            ]),
            ...candidateAccounts.flatMap(account => [
                account.key,
                toFiatAmount(account.formattedBalance, account, currentFiatRates, baseCurrency),
            ]),
        ),
);
