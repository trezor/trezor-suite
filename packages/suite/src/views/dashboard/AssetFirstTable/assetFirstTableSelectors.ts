import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetHolding,
    type AssetHoldingKey,
    type AssetHoldingsRootState,
    type AssetKey,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    assetHoldingsIndex,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectHiddenAssetHoldingKeySet,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type AssetFirstGrouping,
    type AssetFirstNetworkGroup,
    groupAssetRowsByNetwork,
} from './assetFirstTableGrouping';
import { getAssetDisplaySymbol, sumAssetHoldings } from './assetFirstTableUtils';

export type AssetFirstTableState = AssetHoldingsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

export type AssetRow = {
    assetKey: AssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    cryptoBalance: BigNumber;
    tokenInfo: TokenInfo | undefined;
    fiatValue: BigNumber;
    weekAgoFiatValue: BigNumber;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

const builtRows = new Map<AssetKey, AssetRow>();

const isSameRow = (previous: AssetRow, next: AssetRow) =>
    previous.cryptoBalance.eq(next.cryptoBalance) &&
    previous.fiatValue.eq(next.fiatValue) &&
    previous.weekAgoFiatValue.eq(next.weekAgoFiatValue) &&
    previous.tokenInfo === next.tokenInfo &&
    previous.displaySymbol === next.displaySymbol;

const settleRow = (next: AssetRow): AssetRow => {
    const previous = builtRows.get(next.assetKey);
    const row = previous && isSameRow(previous, next) ? previous : next;
    builtRows.set(next.assetKey, row);

    return row;
};

const compareRows = (left: AssetRow, right: AssetRow) =>
    right.fiatValue.comparedTo(left.fiatValue) ||
    left.displaySymbol.localeCompare(right.displaySymbol) ||
    left.symbol.localeCompare(right.symbol);

export type AssetTotal = {
    assetKey: AssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    cryptoBalance: BigNumber;
    tokenInfo: TokenInfo | undefined;
};

// An asset whose holdings and hiding are unchanged is summed once: the index hands back the same
// array for a group it did not touch, so the sum can hang off it.
const summedAssets = new WeakMap<object, WeakMap<object, AssetTotal>>();

const sumAsset = (
    holdings: readonly AssetHolding[],
    hidden: ReadonlySet<AssetHoldingKey>,
): AssetTotal | undefined => {
    const known = summedAssets.get(holdings)?.get(hidden);

    if (known !== undefined) {
        return known;
    }

    const shown = holdings.filter(
        holding => holding.isAccountVisible && !hidden.has(holding.holdingKey),
    );

    if (shown.length === 0) {
        return undefined;
    }

    const { cryptoBalance, tokenInfo } = sumAssetHoldings(shown);
    // Every holding of one asset says the same about which asset it is.
    const [{ assetKey, symbol, contractAddress }] = shown as [AssetHolding];
    const asset: AssetTotal = {
        assetKey,
        symbol,
        contractAddress,
        displaySymbol: getAssetDisplaySymbol({ symbol, tokenInfo }),
        cryptoBalance,
        tokenInfo,
    };

    const forHoldings = summedAssets.get(holdings) ?? new WeakMap<object, AssetTotal>();
    forHoldings.set(hidden, asset);
    summedAssets.set(holdings, forHoldings);

    return asset;
};

/**
 * One entry per asset the given wallet holds, over however many accounts hold it.
 *
 * The index has already gathered the holdings of an asset, so this adds them up rather than
 * gathering them again. What an asset is worth is not here: the rates tick far more often than
 * the holdings change, and pricing them is `selectAssetFirstRows`.
 */
export const selectAssetFirstAssets = createMemoizedSelector(
    [
        (state: AssetFirstTableState) => assetHoldingsIndex.read(state).groups.byAsset,
        selectHiddenAssetHoldingKeySet,
        selectEnabledNetworks,
        (_state: AssetFirstTableState, deviceState: StaticSessionId) => deviceState,
    ],
    (assetGroups, hidden, enabledNetworks, deviceState): readonly AssetTotal[] => {
        const assets = [...assetGroups.values()].flatMap(group => {
            const [holding] = group.entities;

            if (holding?.deviceState !== deviceState || !enabledNetworks.includes(holding.symbol)) {
                return [];
            }

            return sumAsset(group.entities, hidden) ?? [];
        });

        return returnStableArrayIfEmpty(assets);
    },
);

/** The assets priced in the user's currency, most valuable first. */
export const selectAssetFirstRows = createMemoizedSelector(
    [selectAssetFirstAssets, selectCurrentFiatRates, selectLastWeekFiatRates, selectBaseCurrency],
    (assets, currentFiatRates, lastWeekFiatRates, baseCurrencyCode): readonly AssetRow[] => {
        const priced = assets.map(asset => {
            const fiatRateKey = getFiatRateKey(
                asset.symbol,
                baseCurrencyCode,
                asset.contractAddress,
            );
            const amount = asset.cryptoBalance.toFixed();

            return settleRow({
                ...asset,
                fiatValue:
                    toFiatCurrency({ amount, rate: currentFiatRates?.[fiatRateKey]?.rate }) ??
                    ZERO_FIAT_VALUE,
                weekAgoFiatValue:
                    toFiatCurrency({ amount, rate: lastWeekFiatRates?.[fiatRateKey]?.rate }) ??
                    ZERO_FIAT_VALUE,
            });
        });

        return returnStableArrayIfEmpty(priced.sort(compareRows));
    },
);

export type AssetFirstTotals = {
    fiatValue: BigNumber;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const getAssetFirstTotals = (rows: readonly AssetRow[]): AssetFirstTotals => {
    const fiatValue = rows.reduce((total, row) => total.plus(row.fiatValue), ZERO_FIAT_VALUE);

    if (!rows.some(row => row.weekAgoFiatValue.gt(0))) {
        return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
    }

    const weekAgoFiatValue = rows.reduce(
        (total, row) => total.plus(row.weekAgoFiatValue),
        ZERO_FIAT_VALUE,
    );
    const weekChange = fiatValue.minus(weekAgoFiatValue);

    return {
        fiatValue,
        weekChange,
        weekChangePercent: weekChange.div(weekAgoFiatValue).times(100),
    };
};

export type AssetFirstTableView =
    | { grouping: 'default'; rows: readonly AssetRow[] }
    | { grouping: 'networks'; groups: readonly AssetFirstNetworkGroup[] };

const selectDefaultView = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): AssetFirstTableView => ({ grouping: 'default', rows }),
);

const selectNetworksView = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): AssetFirstTableView => ({
        grouping: 'networks',
        groups: groupAssetRowsByNetwork(rows),
    }),
);

export const selectAssetFirstTableView = (grouping: AssetFirstGrouping) =>
    grouping === 'networks' ? selectNetworksView : selectDefaultView;
