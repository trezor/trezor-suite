import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkNamesMap } from '@suite-common/networks';
import { type NetworkSymbol, getAssetName, getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type AssetAccount,
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type HiddenTokenReason,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getAccountCryptoBalanceWithStaking,
    selectAreHomeAssetSmallBalancesShown,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAssetAccounts,
    selectEnabledNetworks,
    selectHiddenAssetAccountKeySet,
    selectHiddenTokenReasons,
    selectLastWeekFiatRates,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import {
    type CryptoBaseCurrencyPair,
    type Rate,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { sumAssetAccounts } from './homeAssetTableUtils';

export type AssetIdentityRootState = AccountsRootState & DeviceRootState;

export type AssetsRootState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createAssetIdentitySelector = createWeakMapSelector.withTypes<AssetIdentityRootState>();
const createAssetsSelector = createWeakMapSelector.withTypes<AssetsRootState>();

const ZERO_FIAT_VALUE = new BigNumber(0);

type WalletAsset = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: BigNumber;
    amount: string;
    displaySymbol: string;
    name: string;
    tokenSymbol: string | undefined;
    tokenDecimals: number | undefined;
};

export const selectAssetTokenInfo = createAssetIdentitySelector(
    [
        selectVisibleDeviceAccountsByNetworkSymbol,
        (
            _state: AssetIdentityRootState,
            _networkSymbol: NetworkSymbol,
            tokenContract?: TokenAddress,
        ) => tokenContract,
    ],
    (accounts, tokenContract) => {
        if (!tokenContract) return null;

        const lowerCaseTokenContract = tokenContract.toLowerCase();

        for (const account of accounts) {
            const token = account.tokens?.find(
                accountToken => accountToken.contract.toLowerCase() === lowerCaseTokenContract,
            );

            if (token) return token;
        }

        return null;
    },
);

export const selectAssetName = createAssetIdentitySelector(
    [
        selectAssetTokenInfo,
        (_state: AssetIdentityRootState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (token, networkSymbol) =>
        getAssetName({
            symbol: networkSymbol,
            tokenName: token?.name,
            tokenSymbol: token?.symbol,
        }),
);

const toWalletAssets = (
    assetAccounts: readonly AssetAccount[],
): ReadonlyMap<WalletAssetKey, WalletAsset> => {
    const grouped = new Map<WalletAssetKey, [AssetAccount, ...AssetAccount[]]>();

    assetAccounts.forEach(assetAccount => {
        const held = grouped.get(assetAccount.assetKey);

        if (held === undefined) {
            grouped.set(assetAccount.assetKey, [assetAccount]);
        } else {
            held.push(assetAccount);
        }
    });

    const assets = new Map<WalletAssetKey, WalletAsset>();

    grouped.forEach((held, assetKey) => {
        const [{ symbol, contractAddress }] = held;
        const { cryptoBalance, tokenInfo } = sumAssetAccounts(held);

        assets.set(assetKey, {
            assetKey,
            symbol,
            contractAddress,
            cryptoBalance,
            amount: cryptoBalance.toFixed(),
            displaySymbol: getDisplaySymbol(tokenInfo?.symbol ?? symbol, contractAddress),
            name: getAssetName({
                symbol,
                tokenName: tokenInfo?.name,
                tokenSymbol: tokenInfo?.symbol,
            }),
            tokenSymbol: tokenInfo?.symbol,
            tokenDecimals: tokenInfo?.decimals,
        });
    });

    return assets;
};

const selectPartitionedAssetAccounts = createAssetsSelector(
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

const selectWalletAssets = createAssetsSelector(
    [selectPartitionedAssetAccounts],
    ({ shown }) => toWalletAssets(shown),
);

const selectHiddenWalletAssets = createAssetsSelector(
    [selectPartitionedAssetAccounts],
    ({ hidden }) => toWalletAssets(hidden),
);

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

        assets.forEach(({ assetKey, symbol, contractAddress }) => {
            const entry = rates?.[getFiatRateKey(symbol, baseCurrencyCode, contractAddress)];
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

const selectWalletAssetRates = createAssetsSelector(
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    pickRates,
    pickedOnce,
);

const selectWalletAssetWeekAgoRates = createAssetsSelector(
    [selectWalletAssets, selectLastWeekFiatRates, selectBaseCurrency],
    pickRates,
    pickedOnce,
);

const selectHiddenWalletAssetRates = createAssetsSelector(
    [selectHiddenWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
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

const selectWalletAssetValues = createAssetsSelector(
    [selectWalletAssets, selectWalletAssetRates],
    priceAssets,
    pricedOnce,
);

const selectWalletAssetWeekAgoValues = createAssetsSelector(
    [selectWalletAssets, selectWalletAssetWeekAgoRates],
    priceAssets,
    pricedOnce,
);

const selectHiddenWalletAssetValues = createAssetsSelector(
    [selectHiddenWalletAssets, selectHiddenWalletAssetRates],
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

        const worth = (assetKey: WalletAssetKey) => values.get(assetKey) ?? ZERO_FIAT_VALUE;

        // `comparedTo` is typed to answer null for a NaN side, which `toFiatCurrency` rules out.
        return worth(right).comparedTo(worth(left)) ?? 0;
    };

export const selectShownWalletAssetKeys = createAssetsSelector(
    [selectWalletAssets, selectWalletAssetValues, selectEnabledNetworks],
    (assets, values, enabledNetworks): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(
            [...assets.values()]
                .filter(asset => enabledNetworks.includes(asset.symbol))
                .map(asset => asset.assetKey)
                .toSorted(byValue(values)),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/** Whether there is anything to draw at all: a boolean, so a reorder of the rows is no re-render. */
export const selectHasShownWalletAssets = createAssetsSelector(
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
const selectUsdToBaseCurrencyRate = createAssetsSelector(
    [selectShownWalletAssetKeys, selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    (assetKeys, assets, rates, baseCurrencyCode): number | undefined => {
        if (baseCurrencyCode === 'usd') {
            return 1;
        }

        for (const assetKey of assetKeys) {
            const asset = assets.get(assetKey);
            const entry =
                asset &&
                rates?.[getFiatRateKey(asset.symbol, baseCurrencyCode, asset.contractAddress)];

            if (entry?.rate && entry.usdRate) {
                return entry.rate / entry.usdRate;
            }
        }

        return undefined;
    },
);

/**
 * Under a dollar, as the spec draws the line, whatever currency is chosen: the values the table
 * already shows, against a dollar converted once. An asset nothing can price has no value to be under
 * it, so it is not small: it stays, sorted below the priced ones. Neither is a coin with nothing on
 * it: an empty account is the network the user enabled, not a leftover, and a token with nothing on
 * it never makes a row in the first place. Until the dollar can be converted nothing is small, which
 * is safe: small balances are shown by default.
 */
const selectSmallBalanceAssetKeySet = createAssetsSelector(
    [
        selectShownWalletAssetKeys,
        selectWalletAssets,
        selectWalletAssetValues,
        selectUsdToBaseCurrencyRate,
    ],
    (assetKeys, assets, values, usdToBaseCurrencyRate): ReadonlySet<WalletAssetKey> => {
        const small = new Set<WalletAssetKey>();

        if (usdToBaseCurrencyRate === undefined) {
            return small;
        }

        const threshold = SMALL_BALANCE_USD_VALUE.times(usdToBaseCurrencyRate);

        assetKeys.forEach(assetKey => {
            const asset = assets.get(assetKey);

            if (
                asset !== undefined &&
                asset.contractAddress === undefined &&
                asset.cryptoBalance.isZero()
            ) {
                return;
            }

            // Rates and balances are never negative, so neither is a value: no `abs` needed.
            if (values.get(assetKey)?.lt(threshold)) {
                small.add(assetKey);
            }
        });

        return small;
    },
);

export type SmallBalanceSummary = {
    assetCount: number;
    fiatValue: BigNumber;
};

const haveSameSmallBalanceSummary = (
    left: SmallBalanceSummary | undefined,
    right: SmallBalanceSummary | undefined,
) => {
    if (left === undefined || right === undefined) {
        return left === right;
    }

    return left.assetCount === right.assetCount && left.fiatValue.eq(right.fiatValue);
};

export const selectSmallBalanceSummary = createAssetsSelector(
    [selectSmallBalanceAssetKeySet, selectWalletAssetValues],
    (small, values): SmallBalanceSummary | undefined => {
        if (small.size === 0) {
            return undefined;
        }

        const fiatValue = [...small].reduce(
            (total, assetKey) => total.plus(values.get(assetKey) ?? ZERO_FIAT_VALUE),
            ZERO_FIAT_VALUE,
        );

        return { assetCount: small.size, fiatValue };
    },
    { memoizeOptions: { resultEqualityCheck: haveSameSmallBalanceSummary } },
);

const selectAllDisplayedAssetKeys = createAssetsSelector(
    [
        selectShownWalletAssetKeys,
        selectSmallBalanceAssetKeySet,
        selectAreHomeAssetSmallBalancesShown,
    ],
    (assetKeys, small, areSmallBalancesShown): readonly WalletAssetKey[] =>
        areSmallBalancesShown
            ? assetKeys
            : returnStableArrayIfEmpty(assetKeys.filter(assetKey => !small.has(assetKey))),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/** How many rows the table may show before it folds; each platform passes its own. */
const selectRowLimit = (_state: AssetsRootState, rowLimit?: number) => rowLimit;

/** Whether the table has more to show than the limit allows: a boolean, so a reorder below it is no re-render. */
export const selectIsHomeAssetTableFoldable = createAssetsSelector(
    [selectAllDisplayedAssetKeys, selectRowLimit],
    (assetKeys, rowLimit): boolean => rowLimit !== undefined && assetKeys.length > rowLimit,
);

/** The rows to draw, cut to `rowLimit` while the table is folded; every row when none is given. */
export const selectDisplayedWalletAssetKeys = createAssetsSelector(
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
        const symbol = assets.get(assetKey)?.symbol;

        if (symbol === undefined) {
            return;
        }

        const grouped = byNetwork.get(symbol) ?? [];

        grouped.push(assetKey);
        byNetwork.set(symbol, grouped);
    });

    return byNetwork;
};

/**
 * Which rows belong to which network. It is rebuilt whenever an account is written, but a rebuild
 * that lands on the same grouping is thrown away, so a balance or a rate leaves every section
 * holding the very array it was handed.
 */
const selectShownAssetKeysByNetwork = createAssetsSelector(
    [selectWalletAssets, selectShownWalletAssetKeys],
    groupAssetKeysByNetwork,
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

const selectDisplayedAssetKeysByNetwork = createAssetsSelector(
    [selectWalletAssets, selectAllDisplayedAssetKeys],
    groupAssetKeysByNetwork,
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

/**
 * What each network is worth. Only this is redone when a balance or a rate moves. A network nothing
 * can price — a testnet, or rates that have yet to land — is left out: a total of zero would be a lie.
 */
const selectNetworkFiatValues = createAssetsSelector(
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
                priced.reduce(
                    (total, assetKey) => total.plus(values.get(assetKey) ?? ZERO_FIAT_VALUE),
                    ZERO_FIAT_VALUE,
                ),
            );
        });

        return worth;
    },
);

/** The networks the shown assets are held on, the most valuable network first. */
const selectSortedNetworkSymbols = createAssetsSelector(
    [selectDisplayedAssetKeysByNetwork, selectNetworkFiatValues],
    (byNetwork, worth): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            [...byNetwork.keys()].toSorted(
                (left, right) =>
                    (worth.get(right) ?? ZERO_FIAT_VALUE).comparedTo(
                        worth.get(left) ?? ZERO_FIAT_VALUE,
                    ) ?? 0,
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectCappedAssetKeysByNetwork = createAssetsSelector(
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

const selectCappedNetworkSymbols = createAssetsSelector(
    [selectCappedAssetKeysByNetwork],
    (byNetwork): readonly NetworkSymbol[] => returnStableArrayIfEmpty([...byNetwork.keys()]),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectDisplayedNetworkSymbols = createAssetsSelector(
    [selectSortedNetworkSymbols, selectCappedNetworkSymbols, selectRowLimit],
    (sorted, capped, rowLimit): readonly NetworkSymbol[] =>
        rowLimit === undefined ? sorted : capped,
);

// No `resultEqualityCheck` on purpose: reselect keeps one previous result per selector rather than
// one per argument, so with a section per network each would be compared against its neighbour's
// list and none would ever match. Handing back the array the grouping already holds needs no check.
export const selectDisplayedWalletAssetKeysOfNetwork = createAssetsSelector(
    [
        // The limit is this selector's third argument and the grouping's second; the grouping is
        // already uncapped when none is given.
        (state: AssetsRootState, _symbol: NetworkSymbol, rowLimit?: number) =>
            selectCappedAssetKeysByNetwork(state, rowLimit),
        (_state: AssetsRootState, symbol: NetworkSymbol) => symbol,
    ],
    (byNetwork, symbol): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(byNetwork.get(symbol) ?? []),
);

export const selectNetworkName = createAssetsSelector(
    [selectNetworkNamesMap, (_state: AssetsRootState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectNetworkFiatValue = createAssetsSelector(
    [selectNetworkFiatValues, (_state: AssetsRootState, symbol: NetworkSymbol) => symbol],
    (worth, symbol) => worth.get(symbol)?.toFixed(),
);

const selectWalletAsset = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden = false,
) => (isHidden ? selectHiddenWalletAssets(state) : selectWalletAssets(state)).get(assetKey);

export const selectWalletAssetSymbol = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.symbol;

export const selectWalletAssetContractAddress = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.contractAddress;

export const selectWalletAssetDisplaySymbol = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.displaySymbol;

export const selectWalletAssetName = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.name;

export const selectWalletAssetAmount = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.amount;

export const selectWalletAssetStakingAmount = createAssetsSelector(
    [selectVisibleDeviceAccounts, selectWalletAssetSymbol, selectWalletAssetContractAddress],
    (accounts, networkSymbol, contractAddress) => {
        if (networkSymbol === undefined || contractAddress !== undefined) return '0';

        const stakingBalance = accounts.reduce((balance, account) => {
            if (account.symbol !== networkSymbol) return balance;

            return balance
                .plus(getAccountCryptoBalanceWithStaking(account))
                .minus(account.formattedBalance);
        }, new BigNumber(0));

        return BigNumber.max(stakingBalance, 0).toFixed();
    },
);

export const selectWalletAssetHasStaking = createAssetsSelector(
    [selectWalletAssetStakingAmount],
    stakingBalance => new BigNumber(stakingBalance).gt(0),
);

export const selectWalletAssetTotalAmount = createAssetsSelector(
    [selectWalletAssetAmount, selectWalletAssetStakingAmount],
    (availableAmount, stakingAmount) =>
        availableAmount === undefined
            ? undefined
            : new BigNumber(availableAmount).plus(stakingAmount).toFixed(),
);

export const selectWalletAssetTokenSymbol = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.tokenSymbol;

export const selectWalletAssetTokenDecimals = (
    state: AssetsRootState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.tokenDecimals;

const byCryptoBalance =
    (assets: ReadonlyMap<WalletAssetKey, WalletAsset>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        const balance = (assetKey: WalletAssetKey) =>
            assets.get(assetKey)?.cryptoBalance ?? ZERO_FIAT_VALUE;

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

const selectHiddenWalletAssetKeysByReason = createAssetsSelector(
    [
        selectHiddenWalletAssets,
        selectHiddenWalletAssetValues,
        selectHiddenTokenReasons,
        selectEnabledNetworks,
    ],
    (
        assets,
        values,
        reasons,
        enabledNetworks,
    ): ReadonlyMap<HiddenTokenReason, readonly WalletAssetKey[]> => {
        const byReason = new Map<HiddenTokenReason, WalletAssetKey[]>();

        assets.forEach((asset, assetKey) => {
            if (asset.contractAddress === undefined || !enabledNetworks.includes(asset.symbol)) {
                return;
            }

            const reason = reasons.get(asset.symbol)?.get(asset.contractAddress);

            if (reason === undefined) {
                return;
            }

            const grouped = byReason.get(reason) ?? [];

            grouped.push(assetKey);
            byReason.set(reason, grouped);
        });

        byReason.forEach((assetKeys, reason) => {
            byReason.set(reason, assetKeys.toSorted(byFiatThenCryptoBalance(assets, values)));
        });

        return byReason;
    },
    // Rebuilt on every account write, so a rebuild that lands on the same lists is thrown away and
    // each group keeps the array it was handed; the per-reason selector below must stay unchecked.
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

export const selectHiddenWalletAssetKeys = createAssetsSelector(
    [
        selectHiddenWalletAssetKeysByReason,
        (_state: AssetsRootState, reason: HiddenTokenReason) => reason,
    ],
    (byReason, reason): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(byReason.get(reason) ?? []),
);

export const selectHasHiddenWalletAssets = createAssetsSelector(
    [selectHiddenWalletAssetKeysByReason],
    byReason => byReason.size > 0,
);

export type HomeAssetTotals = {
    /** Undefined while nothing the wallet holds can be priced — a total of zero would be a lie. */
    fiatValue: BigNumber | undefined;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const selectHomeAssetTotals = createAssetsSelector(
    [selectShownWalletAssetKeys, selectWalletAssetValues, selectWalletAssetWeekAgoValues],
    (assetKeys, values, weekAgoValues): HomeAssetTotals => {
        const addUp = (
            priced: ReadonlyMap<WalletAssetKey, BigNumber>,
            keys: readonly WalletAssetKey[],
        ) =>
            keys.reduce(
                (total, assetKey) => total.plus(priced.get(assetKey) ?? ZERO_FIAT_VALUE),
                ZERO_FIAT_VALUE,
            );

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
