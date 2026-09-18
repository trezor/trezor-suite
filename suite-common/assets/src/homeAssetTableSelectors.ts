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

const ZERO_FIAT_VALUE = new BigNumber(0);
const ZERO_BALANCE = new BigNumber(0);

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

/** Every asset the wallet holds, hidden ones included: the hidden tokens page lists what the table leaves out. */
const selectAllWalletAssets = createMemoizedSelector(
    [selectDeviceAssetAccounts],
    (assetAccounts): ReadonlyMap<WalletAssetKey, WalletAsset> => {
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
    },
);

/** A token is hidden for all the accounts that hold it, so hiding reads the same per asset. */
const selectHiddenWalletAssetKeySet = createMemoizedSelector(
    [selectDeviceAssetAccounts, selectHiddenAssetAccountKeySet],
    (assetAccounts, hiddenAccounts): ReadonlySet<WalletAssetKey> => {
        const hidden = new Set<WalletAssetKey>();

        assetAccounts.forEach(assetAccount => {
            if (hiddenAccounts.has(assetAccount.assetAccountKey)) {
                hidden.add(assetAccount.assetKey);
            }
        });

        return hidden;
    },
);

const selectWalletAssets = createMemoizedSelector(
    [selectAllWalletAssets, selectHiddenWalletAssetKeySet],
    (assets, hidden): ReadonlyMap<WalletAssetKey, WalletAsset> => {
        const shown = new Map<WalletAssetKey, WalletAsset>();

        assets.forEach((asset, assetKey) => {
            if (!hidden.has(assetKey)) {
                shown.set(assetKey, asset);
            }
        });

        return shown;
    },
);

const selectHiddenWalletAssets = createMemoizedSelector(
    [selectAllWalletAssets, selectHiddenWalletAssetKeySet],
    (assets, hidden): ReadonlyMap<WalletAssetKey, WalletAsset> => {
        const held = new Map<WalletAssetKey, WalletAsset>();

        hidden.forEach(assetKey => {
            const asset = assets.get(assetKey);

            if (asset !== undefined) {
                held.set(assetKey, asset);
            }
        });

        return held;
    },
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

/** The hidden tokens page sorts by worth too, and the shown values leave the hidden ones out. */
const selectHiddenWalletAssetValues = createMemoizedSelector(
    [selectHiddenWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    priceAssets,
    pricedOnce,
);

const byValue =
    (values: ReadonlyMap<WalletAssetKey, BigNumber>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        const worth = (assetKey: WalletAssetKey) => values.get(assetKey) ?? ZERO_FIAT_VALUE;

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

/**
 * Which rows belong to which network. It is rebuilt whenever an account is written, but a rebuild
 * that lands on the same grouping is thrown away, so a balance or a rate leaves every section
 * holding the very array it was handed.
 */
const selectShownAssetKeysByNetwork = createMemoizedSelector(
    [selectWalletAssets, selectShownWalletAssetKeys],
    (assets, assetKeys): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
        const byNetwork = new Map<NetworkSymbol, WalletAssetKey[]>();

        assetKeys.forEach(assetKey => {
            const symbol = assets.get(assetKey)?.symbol;

            if (symbol === undefined) {
                return;
            }

            const held = byNetwork.get(symbol);

            if (held === undefined) {
                byNetwork.set(symbol, [assetKey]);

                return;
            }

            held.push(assetKey);
        });

        return byNetwork;
    },
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
export const selectShownNetworkSymbols = createMemoizedSelector(
    [selectShownAssetKeysByNetwork, selectNetworkFiatValues],
    (byNetwork, worth): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            [...byNetwork.keys()].sort(
                (left, right) =>
                    (worth.get(right) ?? ZERO_FIAT_VALUE).comparedTo(
                        worth.get(left) ?? ZERO_FIAT_VALUE,
                    ) ?? 0,
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

// No `resultEqualityCheck` on purpose: reselect keeps one previous result per selector rather than
// one per argument, so with a section per network each would be compared against its neighbour's
// list and none would ever match. Handing back the array the grouping already holds needs no check.
export const selectShownWalletAssetKeysOfNetwork = createMemoizedSelector(
    [selectShownAssetKeysByNetwork, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (byNetwork, symbol): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(byNetwork.get(symbol) ?? []),
);

export const selectNetworkName = createMemoizedSelector(
    [selectNetworkNamesMap, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectNetworkFiatValue = createMemoizedSelector(
    [selectNetworkFiatValues, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (worth, symbol) => worth.get(symbol)?.toFixed(),
);

const selectWalletAsset = createMemoizedSelector(
    [selectAllWalletAssets, (_state: HomeAssetTableState, assetKey: WalletAssetKey) => assetKey],
    (assets, assetKey) => assets.get(assetKey),
);

export const selectWalletAssetSymbol = (state: HomeAssetTableState, assetKey: WalletAssetKey) =>
    selectWalletAsset(state, assetKey)?.symbol;

export const selectWalletAssetContractAddress = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
) => selectWalletAsset(state, assetKey)?.contractAddress;

export const selectWalletAssetDisplaySymbol = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
) => selectWalletAsset(state, assetKey)?.displaySymbol;

export const selectWalletAssetAmount = (state: HomeAssetTableState, assetKey: WalletAssetKey) =>
    selectWalletAsset(state, assetKey)?.amount;

export const selectWalletAssetTokenSymbol = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
) => selectWalletAsset(state, assetKey)?.tokenSymbol;

export const selectWalletAssetTokenDecimals = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
) => selectWalletAsset(state, assetKey)?.tokenDecimals;

const byCryptoBalance =
    (assets: ReadonlyMap<WalletAssetKey, WalletAsset>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        const balance = (assetKey: WalletAssetKey) =>
            assets.get(assetKey)?.cryptoBalance ?? ZERO_BALANCE;

        return balance(right).comparedTo(balance(left)) ?? 0;
    };

/** What it is worth, and where nothing can price it — a hidden token often cannot be priced — what is held. */
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
        selectAllWalletAssets,
        selectHiddenWalletAssetKeySet,
        selectHiddenWalletAssetValues,
        selectHiddenTokenReasons,
        selectEnabledNetworks,
    ],
    (
        assets,
        hiddenKeys,
        values,
        reasons,
        enabledNetworks,
    ): ReadonlyMap<HiddenTokenReason, readonly WalletAssetKey[]> => {
        const byReason = new Map<HiddenTokenReason, WalletAssetKey[]>();

        hiddenKeys.forEach(assetKey => {
            const asset = assets.get(assetKey);

            // Only a token can be hidden, so a hidden key always has a contract: the guard is for the type.
            if (asset?.contractAddress === undefined || !enabledNetworks.includes(asset.symbol)) {
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
