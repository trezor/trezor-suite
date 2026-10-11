import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkNamesMap } from '@suite-common/networks';
import { type NetworkSymbol, getAssetName, getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAssetAccounts,
    selectEnabledNetworks,
    selectHiddenAssetAccountKeySet,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type RatesByKey, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { sumAssetAccounts } from './homeAssetTableUtils';

export type HomeAssetTableState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

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

const selectWalletAssets = createMemoizedSelector(
    [selectDeviceAssetAccounts, selectHiddenAssetAccountKeySet],
    (assetAccounts, hidden): ReadonlyMap<WalletAssetKey, WalletAsset> => {
        const shown = new Map<WalletAssetKey, [AssetAccount, ...AssetAccount[]]>();

        assetAccounts.forEach(assetAccount => {
            if (hidden.has(assetAccount.assetAccountKey)) {
                return;
            }

            const held = shown.get(assetAccount.assetKey);

            if (held === undefined) {
                shown.set(assetAccount.assetKey, [assetAccount]);
            } else {
                held.push(assetAccount);
            }
        });

        const assets = new Map<WalletAssetKey, WalletAsset>();

        shown.forEach((held, assetKey) => {
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

const haveSameNetworkGrouping = (
    left: ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]>,
    right: ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]>,
) =>
    left.size === right.size &&
    [...left].every(([symbol, assetKeys]) => {
        const held = right.get(symbol);

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
    { memoizeOptions: { resultEqualityCheck: haveSameNetworkGrouping } },
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
    [selectWalletAssets, (_state: HomeAssetTableState, assetKey: WalletAssetKey) => assetKey],
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
