import { shallowEqual } from 'react-redux';

import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectHasBitcoinOnlyFirmware,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import {
    formatStakingAmount,
    selectDeviceStakingPositionEntries,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount, stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    type NetworksRootState,
    selectNetworkNamesMap,
    selectSupportedNetworkSymbols,
} from '@suite-common/networks';
import { type TokenAddress, type TokenSymbol, toTokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getWalletAssetKey,
    selectAreHomeAssetSmallBalancesShown,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledSupportedNetworks,
    selectHomeAssetsTableGrouping,
    selectLastWeekFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseCurrencyAmount,
    type CryptoBaseCurrencyPair,
    type Rate,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    hasNetworkFeatures,
    isPositiveBalance,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type AssetAccount,
    type AssetAccountsRootState,
    type HiddenTokenReason,
    selectDeviceAssetAccounts,
    selectHiddenAssetAccountKeySet,
    selectHiddenTokenReasons,
} from './assetAccountsSelectors';
import { sumAssetAccounts } from './homeAssetTableUtils';
import {
    type SmallBalanceSummary,
    haveSameSmallBalanceSummary,
    summarizeSmallBalances,
} from './smallBalances';
import { getAvailableAmount, getStakingRatio } from './stakingSplitUtils';

export type AssetTableState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetTableState>();

const ZERO = new BigNumber(0);

type WalletAsset = {
    assetKey: WalletAssetKey;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: BigNumber;
    amount: string;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
    accountCount: number;
};

const groupWalletAssets = (
    assetAccounts: readonly AssetAccount[],
): ReadonlyMap<WalletAssetKey, WalletAsset> => {
    const byKey = new Map<WalletAssetKey, [AssetAccount, ...AssetAccount[]]>();

    assetAccounts.forEach(assetAccount => {
        const held = byKey.get(assetAccount.assetKey);

        if (held === undefined) {
            byKey.set(assetAccount.assetKey, [assetAccount]);
        } else {
            held.push(assetAccount);
        }
    });

    const assets = new Map<WalletAssetKey, WalletAsset>();

    byKey.forEach((held, assetKey) => {
        const [{ networkSymbol, contractAddress }] = held;
        const { cryptoBalance, tokenInfo } = sumAssetAccounts(held);

        assets.set(assetKey, {
            assetKey,
            networkSymbol,
            contractAddress,
            cryptoBalance,
            amount: cryptoBalance.toFixed(),
            tokenSymbol: tokenInfo?.symbol === undefined ? null : toTokenSymbol(tokenInfo.symbol),
            tokenDecimals: tokenInfo?.decimals,
            accountCount: held.filter(assetAccount => isPositiveBalance(assetAccount.cryptoBalance))
                .length,
        });
    });

    return assets;
};

const selectPartitionedAssetAccounts = createMemoizedSelector(
    [selectDeviceAssetAccounts, selectHiddenAssetAccountKeySet],
    (assetAccounts, hiddenAccounts) => {
        const shown: AssetAccount[] = [];
        const hidden: AssetAccount[] = [];

        assetAccounts.forEach(assetAccount => {
            (hiddenAccounts.has(assetAccount.assetAccountKey) ? hidden : shown).push(assetAccount);
        });

        return { shown, hidden };
    },
);

const selectWalletAssets = createMemoizedSelector([selectPartitionedAssetAccounts], ({ shown }) =>
    groupWalletAssets(shown),
);

const selectHiddenWalletAssets = createMemoizedSelector(
    [selectPartitionedAssetAccounts],
    ({ hidden }) => groupWalletAssets(hidden),
);

const selectAccountHiddenAssets = createMemoizedSelector(
    [
        (state: AssetTableState) => selectPartitionedAssetAccounts(state),
        (_state: AssetTableState, accountKey: AccountKey) => accountKey,
    ],
    ({ hidden }, accountKey) =>
        groupWalletAssets(hidden.filter(assetAccount => assetAccount.accountKey === accountKey)),
);

const selectHiddenAssets = (state: AssetTableState, accountKey?: AccountKey) =>
    accountKey === undefined
        ? selectHiddenWalletAssets(state)
        : selectAccountHiddenAssets(state, accountKey);

/**
 * The rate of each asset, as a plain number. The fiat state is rewritten on every fetch — a batch of
 * a few tickers, a loading flag flipped — so whatever reads it reruns often. This pass is the cheap
 * one: a key and a lookup per asset, and the same map handed back when no number moved, so the
 * arithmetic behind it runs only when a price does.
 */
const pickRatesBy =
    <Entry>(pickRate: (entry: Entry) => number | undefined) =>
    (
        assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
        rates: Record<CryptoBaseCurrencyPair, Entry> | undefined,
        baseCurrencyCode: BaseCurrencyCode,
    ): ReadonlyMap<WalletAssetKey, number> => {
        const picked = new Map<WalletAssetKey, number>();

        assets.forEach(({ assetKey, networkSymbol, contractAddress }) => {
            const entry = rates?.[getFiatRateKey(networkSymbol, baseCurrencyCode, contractAddress)];
            const rate = entry && pickRate(entry);

            if (rate !== undefined) {
                picked.set(assetKey, rate);
            }
        });

        return picked;
    };

const haveSameRates = (
    left: ReadonlyMap<WalletAssetKey, number>,
    right: ReadonlyMap<WalletAssetKey, number>,
) =>
    left.size === right.size && [...left].every(([assetKey, rate]) => right.get(assetKey) === rate);

const pickedOnce = { memoizeOptions: { resultEqualityCheck: haveSameRates } };

const pickRates = pickRatesBy((entry: Rate) => entry.rate);

const selectWalletAssetRates = createMemoizedSelector(
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    pickRates,
    pickedOnce,
);

const selectWalletAssetWeekAgoRates = createMemoizedSelector(
    [selectWalletAssets, selectLastWeekFiatRates, selectBaseCurrency],
    pickRates,
    pickedOnce,
);

const selectHiddenAssetRates = createMemoizedSelector(
    [
        selectHiddenAssets,
        (state: AssetTableState) => selectCurrentFiatRates(state),
        (state: AssetTableState) => selectBaseCurrency(state),
    ],
    pickRates,
    pickedOnce,
);

/** What each asset is worth: the one pass with arithmetic in it, run only when a rate or a balance moved. */
const priceAssets = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    rates: ReadonlyMap<WalletAssetKey, number>,
): ReadonlyMap<WalletAssetKey, BigNumber> => {
    const priced = new Map<WalletAssetKey, BigNumber>();

    rates.forEach((rate, assetKey) => {
        const amount = assets.get(assetKey)?.amount;
        const fiatValue = amount === undefined ? null : toFiatCurrency({ amount, rate });

        if (fiatValue !== null) {
            priced.set(assetKey, fiatValue);
        }
    });

    return priced;
};

const haveSameFiatValues = (
    left: ReadonlyMap<WalletAssetKey, BigNumber>,
    right: ReadonlyMap<WalletAssetKey, BigNumber>,
) =>
    left.size === right.size &&
    [...left].every(([assetKey, fiatValue]) => right.get(assetKey)?.eq(fiatValue));

const pricedOnce = { memoizeOptions: { resultEqualityCheck: haveSameFiatValues } };

const selectWalletAssetValues = createMemoizedSelector(
    [selectWalletAssets, selectWalletAssetRates],
    priceAssets,
    pricedOnce,
);

const selectWalletAssetWeekAgoValues = createMemoizedSelector(
    [selectWalletAssets, selectWalletAssetWeekAgoRates],
    priceAssets,
    pricedOnce,
);

const selectHiddenAssetValues = createMemoizedSelector(
    [selectHiddenAssets, selectHiddenAssetRates],
    priceAssets,
    pricedOnce,
);

const byValue =
    (values: ReadonlyMap<WalletAssetKey, BigNumber>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        // What nothing can price goes below everything that can, even below what is worth zero.
        const isPriced = (assetKey: WalletAssetKey) => values.has(assetKey);

        if (isPriced(left) !== isPriced(right)) {
            return isPriced(left) ? -1 : 1;
        }

        const worth = (assetKey: WalletAssetKey) => values.get(assetKey) ?? ZERO;

        // `comparedTo` is typed to answer null for a NaN side, which `toFiatCurrency` rules out.
        return worth(right).comparedTo(worth(left)) ?? 0;
    };

// Enabled networks are what discovery looks for on a device. The Portfolio Tracker discovers
// nothing: its accounts are imported one by one, on networks that setting may not hold.
const selectAllowedNetworkSymbols = (state: AssetTableState): readonly NetworkSymbol[] =>
    selectIsPortfolioTrackerDevice(state)
        ? selectSupportedNetworkSymbols(state)
        : selectEnabledSupportedNetworks(state);

export const selectShownWalletAssetKeys = createMemoizedSelector(
    [selectWalletAssets, selectWalletAssetValues, selectAllowedNetworkSymbols],
    (assets, values, allowedNetworks): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(
            [...assets.values()]
                .filter(
                    asset =>
                        allowedNetworks.includes(asset.networkSymbol) && asset.cryptoBalance.gt(0),
                )
                .map(asset => asset.assetKey)
                .sort(byValue(values)),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/** Whether there is anything to draw at all: a boolean, so a reorder of the rows is no re-render. */
export const selectHasShownWalletAssets = createMemoizedSelector(
    [selectShownWalletAssetKeys],
    (assetKeys): boolean => assetKeys.length > 0,
);

const SMALL_BALANCE_USD_VALUE = new BigNumber(1);

/**
 * What a dollar is in the chosen currency, as one plain number. Every current rate carries its dollar
 * rate (see `CurrentFiatRatesResult`) and a provider prices everything through one exchange-rate
 * table, so `rate / usdRate` is the same for every asset it holds — one asset's pair is enough, and
 * nothing need be priced twice. Two providers can sit on slightly different snapshots, so an asset
 * worth almost exactly a dollar may fall on either side of the line; for a switch that hides dust
 * that is nothing. The most valuable priced asset is asked first: its rates are the ones most watched.
 */
const selectUsdToBaseCurrencyRate = createMemoizedSelector(
    [selectShownWalletAssetKeys, selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    (assetKeys, assets, rates, baseCurrencyCode): number | undefined => {
        if (baseCurrencyCode === 'usd') {
            return 1;
        }

        for (const assetKey of assetKeys) {
            const asset = assets.get(assetKey);
            const entry =
                asset &&
                rates?.[
                    getFiatRateKey(asset.networkSymbol, baseCurrencyCode, asset.contractAddress)
                ];

            if (entry?.rate && entry.usdRate) {
                return entry.rate / entry.usdRate;
            }
        }

        return undefined;
    },
);

/**
 * What a small balance is worth at most, in the selected currency: a dollar. Unknown until the USD
 * rate is, so that nothing is called small by mistake.
 */
export const selectSmallBalanceFiatThreshold = createMemoizedSelector(
    [selectUsdToBaseCurrencyRate],
    (usdToBaseCurrencyRate): string | undefined =>
        usdToBaseCurrencyRate === undefined
            ? undefined
            : SMALL_BALANCE_USD_VALUE.times(usdToBaseCurrencyRate).toFixed(),
);

/**
 * Assets worth under $1 in the selected currency. An unpriced asset is never small, and nothing is
 * small until the USD rate is known, so nothing is hidden by mistake.
 */
const selectSmallBalanceAssetKeySet = createMemoizedSelector(
    [selectShownWalletAssetKeys, selectWalletAssetValues, selectSmallBalanceFiatThreshold],
    (assetKeys, values, threshold): ReadonlySet<WalletAssetKey> => {
        const small = new Set<WalletAssetKey>();

        if (threshold === undefined) {
            return small;
        }

        assetKeys.forEach(assetKey => {
            // Rates and balances are never negative, so neither is a value: no `abs` needed.
            if (values.get(assetKey)?.lt(threshold)) {
                small.add(assetKey);
            }
        });

        return small;
    },
);

export const selectSmallBalanceSummary = createMemoizedSelector(
    [selectSmallBalanceAssetKeySet, selectWalletAssetValues],
    (small, values): SmallBalanceSummary | undefined =>
        summarizeSmallBalances([...small].map(assetKey => values.get(assetKey) ?? ZERO)),
    { memoizeOptions: { resultEqualityCheck: haveSameSmallBalanceSummary } },
);

export const selectIsHomeAssetTableMenuAvailable = (state: AssetTableState) =>
    !selectHasBitcoinOnlyFirmware(state);

/** The saved grouping, or the default one while the menu that sets it is not offered. */
export const selectHomeAssetGrouping = (state: AssetTableState): HomeAssetGrouping =>
    selectIsHomeAssetTableMenuAvailable(state) ? selectHomeAssetsTableGrouping(state) : 'default';

/**
 * The saved switch, or shown while the menu holding it is not offered: nothing else could bring
 * small balances back.
 */
export const selectAreAssetTableSmallBalancesDisplayed = (state: AssetTableState) =>
    !selectIsHomeAssetTableMenuAvailable(state) || selectAreHomeAssetSmallBalancesShown(state);

const selectAllDisplayedAssetKeys = createMemoizedSelector(
    [
        selectShownWalletAssetKeys,
        selectSmallBalanceAssetKeySet,
        selectAreAssetTableSmallBalancesDisplayed,
    ],
    (assetKeys, small, areSmallBalancesShown): readonly WalletAssetKey[] =>
        areSmallBalancesShown
            ? assetKeys
            : returnStableArrayIfEmpty(assetKeys.filter(assetKey => !small.has(assetKey))),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/** How many rows the table may show before it folds, `ASSET_TABLE_ROW_LIMIT` on both platforms. */
const selectRowLimit = (_state: AssetTableState, rowLimit?: number) => rowLimit;

/** Whether the table has more to show than the limit allows: a boolean, so a reorder below it is no re-render. */
export const selectIsHomeAssetTableFoldable = createMemoizedSelector(
    [selectAllDisplayedAssetKeys, selectRowLimit],
    (assetKeys, rowLimit): boolean => rowLimit !== undefined && assetKeys.length > rowLimit,
);

/** The rows to draw, cut to `rowLimit` while the table is folded; every row when none is given. */
export const selectDisplayedWalletAssetKeys = createMemoizedSelector(
    [selectAllDisplayedAssetKeys, selectRowLimit],
    (assetKeys, rowLimit): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(rowLimit === undefined ? assetKeys : assetKeys.slice(0, rowLimit)),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export type HomeAssetGrouping = 'default' | 'networks';

const haveSameGrouping = <Group>(
    left: ReadonlyMap<Group, readonly WalletAssetKey[]>,
    right: ReadonlyMap<Group, readonly WalletAssetKey[]>,
) =>
    left.size === right.size &&
    [...left].every(([group, assetKeys]) => {
        const held = right.get(group);

        return (
            held?.length === assetKeys.length &&
            assetKeys.every((assetKey, index) => held[index] === assetKey)
        );
    });
const groupAssetKeysByNetwork = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    assetKeys: readonly WalletAssetKey[],
): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
    const byNetwork = new Map<NetworkSymbol, WalletAssetKey[]>();

    assetKeys.forEach(assetKey => {
        const networkSymbol = assets.get(assetKey)?.networkSymbol;

        if (networkSymbol === undefined) {
            return;
        }

        const grouped = byNetwork.get(networkSymbol) ?? [];

        grouped.push(assetKey);
        byNetwork.set(networkSymbol, grouped);
    });

    return byNetwork;
};

/**
 * Which rows belong to which network. It is rebuilt whenever an account is written, but a rebuild
 * that lands on the same grouping is thrown away, so a balance or a rate leaves every section
 * holding the very array it was handed.
 */
const selectShownAssetKeysByNetwork = createMemoizedSelector(
    [selectWalletAssets, selectShownWalletAssetKeys],
    groupAssetKeysByNetwork,
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);
const selectDisplayedAssetKeysByNetwork = createMemoizedSelector(
    [selectWalletAssets, selectAllDisplayedAssetKeys],
    groupAssetKeysByNetwork,
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);
/**
 * What each network is worth. Only this is redone when a balance or a rate moves. A network nothing
 * can price — a testnet, or rates that have yet to land — is left out: a total of zero would be a lie.
 */
const selectNetworkFiatValues = createMemoizedSelector(
    [selectShownAssetKeysByNetwork, selectWalletAssetValues],
    (byNetwork, values): ReadonlyMap<NetworkSymbol, BigNumber> => {
        const worth = new Map<NetworkSymbol, BigNumber>();

        byNetwork.forEach((assetKeys, symbol) => {
            const priced = assetKeys.filter(assetKey => values.has(assetKey));

            if (priced.length === 0) {
                return;
            }

            worth.set(
                symbol,
                priced.reduce((total, assetKey) => total.plus(values.get(assetKey) ?? ZERO), ZERO),
            );
        });

        return worth;
    },
);

/** The networks the shown assets are held on, the most valuable network first. */
const selectSortedNetworkSymbols = createMemoizedSelector(
    [selectDisplayedAssetKeysByNetwork, selectNetworkFiatValues],
    (byNetwork, worth): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            [...byNetwork.keys()].sort(
                (left, right) =>
                    (worth.get(right) ?? ZERO).comparedTo(worth.get(left) ?? ZERO) ?? 0,
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);
export const selectCappedAssetKeysByNetwork = createMemoizedSelector(
    [selectSortedNetworkSymbols, selectDisplayedAssetKeysByNetwork, selectRowLimit],
    (symbols, byNetwork, rowLimit): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
        if (rowLimit === undefined) {
            return byNetwork;
        }

        const capped = new Map<NetworkSymbol, readonly WalletAssetKey[]>();
        let budget = rowLimit;

        symbols.forEach(symbol => {
            const taken = (byNetwork.get(symbol) ?? []).slice(0, budget);

            if (taken.length === 0) {
                return;
            }

            capped.set(symbol, taken);
            budget -= taken.length;
        });

        return capped;
    },
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

const selectCappedNetworkSymbols = createMemoizedSelector(
    [selectCappedAssetKeysByNetwork],
    (byNetwork): readonly NetworkSymbol[] => returnStableArrayIfEmpty([...byNetwork.keys()]),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectDisplayedNetworkSymbols = createMemoizedSelector(
    [selectSortedNetworkSymbols, selectCappedNetworkSymbols, selectRowLimit],
    (sorted, capped, rowLimit): readonly NetworkSymbol[] =>
        rowLimit === undefined ? sorted : capped,
);

// No `resultEqualityCheck` on purpose: reselect keeps one previous result per selector rather than
// one per argument, so with a section per network each would be compared against its neighbour's
// list and none would ever match. Handing back the array the grouping already holds needs no check.
export const selectDisplayedWalletAssetKeysOfNetwork = createMemoizedSelector(
    [
        // The limit is this selector's third argument and the grouping's second; the grouping is
        // already uncapped when none is given.
        (state: AssetTableState, _symbol: NetworkSymbol, rowLimit?: number) =>
            selectCappedAssetKeysByNetwork(state, rowLimit),
        (_state: AssetTableState, symbol: NetworkSymbol) => symbol,
    ],
    (byNetwork, symbol): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(byNetwork.get(symbol) ?? []),
);

export const selectNetworkName = createMemoizedSelector(
    [selectNetworkNamesMap, (_state: AssetTableState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectNetworkFiatValue = createMemoizedSelector(
    [selectNetworkFiatValues, (_state: AssetTableState, symbol: NetworkSymbol) => symbol],
    (worth, symbol) => worth.get(symbol)?.toFixed(),
);

const selectWalletAsset = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden = false,
) => {
    if (assetKey === undefined) {
        return undefined;
    }

    const hiddenAsset = () => selectHiddenWalletAssets(state).get(assetKey);

    return isHidden ? hiddenAsset() : (selectWalletAssets(state).get(assetKey) ?? hiddenAsset());
};

export const selectWalletAssetKey = createMemoizedSelector(
    [
        selectDeviceStaticSessionId,
        (_state: AssetTableState, networkSymbol: NetworkSymbol) => networkSymbol,
        (_state: AssetTableState, _networkSymbol: NetworkSymbol, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (deviceState, networkSymbol, tokenContract) =>
        deviceState === null
            ? undefined
            : getWalletAssetKey({
                  deviceState,
                  networkSymbol,
                  contractAddress: tokenContract,
              }),
);

export const selectWalletAssetNetworkSymbol = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.networkSymbol;

export const selectWalletAssetContractAddress = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.contractAddress;

export const selectWalletAssetAmount = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.amount;

export const selectWalletAssetAccountCount = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.accountCount ?? 0;

export const selectWalletAssetHoldings = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        (_state: AssetTableState, assetKey: WalletAssetKey | undefined) => assetKey,
    ],
    (assetAccounts, assetKey): readonly AssetAccount[] =>
        returnStableArrayIfEmpty(
            assetAccounts.filter(
                assetAccount =>
                    assetAccount.assetKey === assetKey &&
                    isPositiveBalance(assetAccount.cryptoBalance),
            ),
        ),
);

export const selectWalletAssetSignVerifyAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectWalletAssetNetworkSymbol],
    (accounts, networkSymbol) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    account.symbol === networkSymbol && hasNetworkFeatures(account, 'sign-verify'),
            ),
        ),
);

const selectWalletAssetStakingBalances = createMemoizedSelector(
    [
        selectDeviceStakingPositionEntries,
        selectWalletAssetNetworkSymbol,
        selectWalletAssetContractAddress,
    ],
    (positions, networkSymbol, contractAddress) => {
        if (networkSymbol === undefined || contractAddress !== undefined) {
            return { staked: '0', total: '0' };
        }

        const isTron = networkSymbol === 'trx';
        let total = ZERO;
        let activeTronStake = ZERO;

        positions.forEach(({ descriptor, position }) => {
            if (descriptor.networkSymbol !== networkSymbol) return;

            total = total.plus(getStakingPositionAmount(position));
            if (isTron) {
                activeTronStake = activeTronStake.plus(position.balances.staked);
            }
        });

        const format = (value: BigNumber) =>
            formatStakingAmount({
                amount: stakingAmountSchema.parse(value.toFixed(0)),
                networkSymbol,
            });

        const totalStakingAmount = format(total);

        return {
            staked: isTron ? format(activeTronStake) : totalStakingAmount,
            total: totalStakingAmount,
        };
    },
);

export const selectWalletAssetStakingAmount = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
) => selectWalletAssetStakingBalances(state, assetKey).staked;

export const selectWalletAssetAvailableAmount = createMemoizedSelector(
    [selectWalletAssetAmount, selectWalletAssetStakingBalances],
    (totalAmount, { total }) => getAvailableAmount(totalAmount, total),
);

export const selectWalletAssetStakingRatio = createMemoizedSelector(
    [selectWalletAssetAvailableAmount, selectWalletAssetStakingAmount],
    (availableAmount, stakingAmount) =>
        availableAmount === undefined
            ? undefined
            : getStakingRatio(
                  new BigNumber(availableAmount).plus(stakingAmount).toFixed(),
                  stakingAmount,
              ),
);

export const selectWalletAssetTokenSymbol = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.tokenSymbol ?? null;

export const selectWalletAssetTokenDecimals = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.tokenDecimals;

const byCryptoBalance =
    (assets: ReadonlyMap<WalletAssetKey, WalletAsset>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        const balance = (assetKey: WalletAssetKey) => assets.get(assetKey)?.cryptoBalance ?? ZERO;

        return balance(right).comparedTo(balance(left)) ?? 0;
    };

const byFiatThenCryptoBalance = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    values: ReadonlyMap<WalletAssetKey, BigNumber>,
) => {
    const byFiat = byValue(values);
    const byCrypto = byCryptoBalance(assets);

    return (left: WalletAssetKey, right: WalletAssetKey) =>
        byFiat(left, right) || byCrypto(left, right);
};

const groupHiddenAssetKeysByReason = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    values: ReadonlyMap<WalletAssetKey, BigNumber>,
    reasons: ReturnType<typeof selectHiddenTokenReasons>,
    allowedNetworks: readonly NetworkSymbol[],
): ReadonlyMap<HiddenTokenReason, readonly WalletAssetKey[]> => {
    const byReason = new Map<HiddenTokenReason, WalletAssetKey[]>();

    assets.forEach((asset, assetKey) => {
        if (asset.contractAddress === undefined || !allowedNetworks.includes(asset.networkSymbol)) {
            return;
        }

        const reason = reasons.get(asset.networkSymbol)?.get(asset.contractAddress);

        if (reason === undefined) {
            return;
        }

        const grouped = byReason.get(reason) ?? [];

        grouped.push(assetKey);
        byReason.set(reason, grouped);
    });

    byReason.forEach(assetKeys => assetKeys.sort(byFiatThenCryptoBalance(assets, values)));

    return byReason;
};

const selectHiddenAssetKeysByReason = createMemoizedSelector(
    [
        selectHiddenAssets,
        selectHiddenAssetValues,
        (state: AssetTableState) => selectHiddenTokenReasons(state),
        (state: AssetTableState) => selectAllowedNetworkSymbols(state),
    ],
    groupHiddenAssetKeysByReason,
    // Rebuilt on every account write, so a rebuild that lands on the same lists is thrown away and
    // each group keeps the array it was handed; the per-reason selector below must stay unchecked.
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

export const selectHiddenAssetKeys = (
    state: AssetTableState,
    reason: HiddenTokenReason,
    accountKey?: AccountKey,
): readonly WalletAssetKey[] =>
    returnStableArrayIfEmpty(selectHiddenAssetKeysByReason(state, accountKey).get(reason) ?? []);

export const selectHasHiddenAssets = (state: AssetTableState, accountKey?: AccountKey): boolean =>
    selectHiddenAssetKeysByReason(state, accountKey).size > 0;

export const selectHiddenAssetAmount = (
    state: AssetTableState,
    assetKey: WalletAssetKey,
    accountKey?: AccountKey,
) => selectHiddenAssets(state, accountKey).get(assetKey)?.amount;

export const selectHiddenWalletAssetCount = createMemoizedSelector(
    [(state: AssetTableState) => selectHiddenAssetKeysByReason(state, undefined)],
    byReason => [...byReason.values()].reduce((count, assetKeys) => count + assetKeys.length, 0),
);

export const selectWalletAssetHiddenReason = (
    state: AssetTableState,
    assetKey: WalletAssetKey | undefined,
): HiddenTokenReason | undefined => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return networkSymbol === undefined || contractAddress === undefined
        ? undefined
        : selectHiddenTokenReasons(state).get(networkSymbol)?.get(contractAddress);
};

export const selectWalletAssetFiatValue = createMemoizedSelector(
    [
        selectWalletAssetValues,
        (state: AssetTableState) => selectHiddenAssetValues(state, undefined),
        (_state: AssetTableState, assetKey: WalletAssetKey | undefined) => assetKey,
    ],
    (values, hiddenValues, assetKey): BaseCurrencyAmount | undefined => {
        if (assetKey === undefined) {
            return undefined;
        }

        const fiatValue = values.get(assetKey) ?? hiddenValues.get(assetKey);

        return fiatValue === undefined ? undefined : asBaseCurrencyAmount(fiatValue);
    },
);

export type HomeAssetTotals = {
    /** Undefined while nothing the wallet holds can be priced; zero once it holds nothing at all. */
    fiatValue: BigNumber | undefined;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const selectHomeAssetTotals = createMemoizedSelector(
    [selectShownWalletAssetKeys, selectWalletAssetValues, selectWalletAssetWeekAgoValues],
    (assetKeys, values, weekAgoValues): HomeAssetTotals => {
        if (assetKeys.length === 0) {
            return { fiatValue: ZERO, weekChange: ZERO, weekChangePercent: ZERO };
        }

        const addUp = (
            priced: ReadonlyMap<WalletAssetKey, BigNumber>,
            keys: readonly WalletAssetKey[],
        ) => keys.reduce((total, assetKey) => total.plus(priced.get(assetKey) ?? ZERO), ZERO);

        const priced = assetKeys.filter(assetKey => values.has(assetKey));
        const fiatValue = priced.length === 0 ? undefined : addUp(values, priced);

        // An asset priced in only one of the two weeks would read as a gain or a loss it never
        // made, so the change is over the assets both weeks could price.
        const comparable = assetKeys.filter(
            assetKey => values.has(assetKey) && weekAgoValues.has(assetKey),
        );
        const weekAgoFiatValue = addUp(weekAgoValues, comparable);

        if (weekAgoFiatValue.isZero()) {
            return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
        }

        const weekChange = addUp(values, comparable).minus(weekAgoFiatValue);

        return {
            fiatValue,
            weekChange,
            weekChangePercent: weekChange.div(weekAgoFiatValue),
        };
    },
);
