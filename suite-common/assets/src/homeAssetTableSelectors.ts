import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkNamesMap } from '@suite-common/networks';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol, getAssetName, getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type HiddenTokenReason,
    type WalletAssetKey,
    type WalletSettingsRootState,
    selectAreHomeAssetSmallBalancesShown,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAssetAccounts,
    selectEnabledNetworks,
    selectHiddenAssetAccountKeySet,
    selectHiddenTokenReasons,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type RatesByKey, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { sumAssetAccounts } from './homeAssetTableUtils';

export type HomeAssetTableState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO = new BigNumber(0);

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

type RateField = 'rate' | 'usdRate';

const priceAssetsBy =
    (rateField: RateField) =>
    (
        assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
        rates: RatesByKey | undefined,
        baseCurrencyCode: BaseCurrencyCode,
    ): ReadonlyMap<WalletAssetKey, BigNumber> => {
        const priced = new Map<WalletAssetKey, BigNumber>();

        assets.forEach(({ assetKey, symbol, contractAddress, amount }) => {
            const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
            const fiatValue = toFiatCurrency({ amount, rate: rates?.[fiatRateKey]?.[rateField] });

            if (fiatValue !== null) {
                priced.set(assetKey, fiatValue);
            }
        });

        return priced;
    };

const priceAssets = priceAssetsBy('rate');

const haveSameFiatValues = (
    left: ReadonlyMap<WalletAssetKey, BigNumber>,
    right: ReadonlyMap<WalletAssetKey, BigNumber>,
) =>
    left.size === right.size &&
    [...left].every(([assetKey, fiatValue]) => right.get(assetKey)?.eq(fiatValue));

const pricedOnce = { memoizeOptions: { resultEqualityCheck: haveSameFiatValues } };

const selectWalletAssetValues = createMemoizedSelector(
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    priceAssets,
    pricedOnce,
);

/**
 * What each asset is worth in dollars. Every current rate carries the dollar rate alongside the chosen
 * currency's (see `CurrentFiatRatesResult`), so a small balance is judged in dollars whatever is chosen.
 */
const selectWalletAssetUsdValues = createMemoizedSelector(
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    priceAssetsBy('usdRate'),
    pricedOnce,
);

const selectWalletAssetWeekAgoValues = createMemoizedSelector(
    [selectWalletAssets, selectLastWeekFiatRates, selectBaseCurrency],
    priceAssets,
    pricedOnce,
);

const selectHiddenWalletAssetValues = createMemoizedSelector(
    [selectHiddenWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
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

export const selectShownWalletAssetKeys = createMemoizedSelector(
    [selectWalletAssets, selectWalletAssetValues, selectEnabledNetworks],
    (assets, values, enabledNetworks): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(
            [...assets.values()]
                .filter(asset => enabledNetworks.includes(asset.symbol))
                .map(asset => asset.assetKey)
                .sort(byValue(values)),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const haveSameKeys = (left: ReadonlySet<WalletAssetKey>, right: ReadonlySet<WalletAssetKey>) =>
    left.size === right.size && [...left].every(assetKey => right.has(assetKey));

/**
 * The assets the price feeds have answered for and could not price in dollars: a token not even
 * CoinGecko knows. Nothing is said about an asset that has not been asked about — a testnet coin is
 * never asked about — or whose answer is still on its way, so none of those are taken for dust.
 */
const selectUnpricedWalletAssetKeySet = createMemoizedSelector(
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    (assets, rates, baseCurrencyCode): ReadonlySet<WalletAssetKey> => {
        const unpriced = new Set<WalletAssetKey>();

        assets.forEach(({ assetKey, symbol, contractAddress }) => {
            const rate = rates?.[getFiatRateKey(symbol, baseCurrencyCode, contractAddress)];

            // A current rate carries its dollar rate or is not there at all, so this reads "answered, and
            // no rate came".
            if (rate !== undefined && !rate.isLoading && !rate.usdRate) {
                unpriced.add(assetKey);
            }
        });

        return unpriced;
    },
    // Rebuilt on every rate write, so a rebuild that lands on the same set is thrown away.
    { memoizeOptions: { resultEqualityCheck: haveSameKeys } },
);

const SMALL_BALANCE_USD_VALUE = new BigNumber(1);

const selectSmallBalanceAssetKeySet = createMemoizedSelector(
    [selectShownWalletAssetKeys, selectWalletAssetUsdValues, selectUnpricedWalletAssetKeySet],
    (assetKeys, usdValues, unpriced): ReadonlySet<WalletAssetKey> => {
        const small = new Set<WalletAssetKey>();

        assetKeys.forEach(assetKey => {
            // What the feeds cannot price is taken for dust rather than left to crowd out what the
            // wallet is worth.
            if (
                unpriced.has(assetKey) ||
                usdValues.get(assetKey)?.abs().lt(SMALL_BALANCE_USD_VALUE)
            ) {
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

export const selectSmallBalanceSummary = createMemoizedSelector(
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

const selectAllDisplayedAssetKeys = createMemoizedSelector(
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

export const HOME_ASSET_ROW_LIMIT = 8;

const selectCappedAssetKeys = createMemoizedSelector(
    [selectAllDisplayedAssetKeys],
    (assetKeys): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(assetKeys.slice(0, HOME_ASSET_ROW_LIMIT)),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const isCappedArg = (_state: HomeAssetTableState, isCapped?: boolean) => isCapped === true;

export const selectDisplayedWalletAssetKeys = createMemoizedSelector(
    [selectAllDisplayedAssetKeys, selectCappedAssetKeys, isCappedArg],
    (displayed, capped, isCapped): readonly WalletAssetKey[] => (isCapped ? capped : displayed),
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
const selectCappedAssetKeysByNetwork = createMemoizedSelector(
    [selectSortedNetworkSymbols, selectDisplayedAssetKeysByNetwork],
    (symbols, byNetwork): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
        const capped = new Map<NetworkSymbol, readonly WalletAssetKey[]>();
        let budget = HOME_ASSET_ROW_LIMIT;

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

export const selectShownNetworkSymbols = createMemoizedSelector(
    [selectSortedNetworkSymbols, selectCappedNetworkSymbols, isCappedArg],
    (sorted, capped, isCapped): readonly NetworkSymbol[] => (isCapped ? capped : sorted),
);

// No `resultEqualityCheck` on purpose: reselect keeps one previous result per selector rather than
// one per argument, so with a section per network each would be compared against its neighbour's
// list and none would ever match. Handing back the array the grouping already holds needs no check.
export const selectShownWalletAssetKeysOfNetwork = createMemoizedSelector(
    [
        selectDisplayedAssetKeysByNetwork,
        selectCappedAssetKeysByNetwork,
        (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol,
        (_state: HomeAssetTableState, _symbol: NetworkSymbol, isCapped?: boolean) =>
            isCapped === true,
    ],
    (byNetwork, capped, symbol, isCapped): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty((isCapped ? capped : byNetwork).get(symbol) ?? []),
);

export const selectNetworkName = createMemoizedSelector(
    [selectNetworkNamesMap, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectNetworkFiatValue = createMemoizedSelector(
    [selectNetworkFiatValues, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (worth, symbol) => worth.get(symbol)?.toFixed(),
);

const selectWalletAsset = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden = false,
) => (isHidden ? selectHiddenWalletAssets(state) : selectWalletAssets(state)).get(assetKey);

export const selectWalletAssetSymbol = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.symbol;

export const selectWalletAssetContractAddress = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.contractAddress;

export const selectWalletAssetDisplaySymbol = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.displaySymbol;

export const selectWalletAssetAmount = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.amount;

export const selectWalletAssetTokenSymbol = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectWalletAsset(state, assetKey, isHidden)?.tokenSymbol;

export const selectWalletAssetTokenDecimals = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
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

const selectHiddenWalletAssetKeysByReason = createMemoizedSelector(
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

        byReason.forEach(assetKeys => assetKeys.sort(byFiatThenCryptoBalance(assets, values)));

        return byReason;
    },
    // Rebuilt on every account write, so a rebuild that lands on the same lists is thrown away and
    // each group keeps the array it was handed; the per-reason selector below must stay unchecked.
    { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
);

export const selectHiddenWalletAssetKeys = createMemoizedSelector(
    [
        selectHiddenWalletAssetKeysByReason,
        (_state: HomeAssetTableState, reason: HiddenTokenReason) => reason,
    ],
    (byReason, reason): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(byReason.get(reason) ?? []),
);

export const selectHasHiddenWalletAssets = createMemoizedSelector(
    [selectHiddenWalletAssetKeysByReason],
    byReason => byReason.size > 0,
);

export type HomeAssetTotals = {
    /** Undefined while nothing the wallet holds can be priced — a total of zero would be a lie. */
    fiatValue: BigNumber | undefined;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const selectHomeAssetTotals = createMemoizedSelector(
    [selectShownWalletAssetKeys, selectWalletAssetValues, selectWalletAssetWeekAgoValues],
    (assetKeys, values, weekAgoValues): HomeAssetTotals => {
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
