import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkNamesMap } from '@suite-common/networks';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    asNetworkSymbol,
    getAssetName,
    getDisplaySymbol,
} from '@suite-common/wallet-config';
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

const priceAssets = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    rates: RatesByKey | undefined,
    baseCurrencyCode: BaseCurrencyCode,
): ReadonlyMap<WalletAssetKey, BigNumber> => {
    const priced = new Map<WalletAssetKey, BigNumber>();

    assets.forEach(({ assetKey, symbol, contractAddress, amount }) => {
        const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
        const fiatValue = toFiatCurrency({ amount, rate: rates?.[fiatRateKey]?.rate });

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
    [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    priceAssets,
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

const SMALL_BALANCE_USD_VALUE = new BigNumber(1);
const BTC = asNetworkSymbol('btc');

/**
 * A small balance is under a dollar whatever the chosen currency. Rates are fetched in the chosen
 * currency only, so the dollar is converted through what a bitcoin is worth in each; while either
 * rate is missing nothing is fetched just for this and only the unpriced assets count as small.
 */
const selectSmallBalanceAssetKeySet = createMemoizedSelector(
    [
        selectShownWalletAssetKeys,
        selectWalletAssetValues,
        selectCurrentFiatRates,
        selectBaseCurrency,
    ],
    (assetKeys, values, rates, baseCurrency): ReadonlySet<WalletAssetKey> => {
        const btcUsdRate = rates?.[getFiatRateKey(BTC, 'usd')]?.rate;
        const btcBaseCurrencyRate = rates?.[getFiatRateKey(BTC, baseCurrency)]?.rate;
        let threshold: BigNumber | undefined;

        if (baseCurrency === 'usd') {
            threshold = SMALL_BALANCE_USD_VALUE;
        } else if (btcUsdRate && btcBaseCurrencyRate) {
            threshold = SMALL_BALANCE_USD_VALUE.times(btcBaseCurrencyRate).div(btcUsdRate);
        }

        const small = new Set<WalletAssetKey>();

        assetKeys.forEach(assetKey => {
            const fiatValue = values.get(assetKey);

            // Without a rate the asset is unknown to the price feeds (it is not even on CoinGecko),
            // so it is taken for dust rather than left to crowd out what the wallet is worth.
            if (fiatValue === undefined) {
                small.add(assetKey);

                return;
            }

            if (threshold !== undefined && fiatValue.abs().lt(threshold)) {
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
