import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
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
import { type RatesByKey, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, isDustHolding, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type AssetFirstArrangement,
    type AssetFirstGrouping,
    getAssetDisplaySymbol,
    getNetworkName,
    sumAssetHoldings,
} from './assetFirstTableUtils';

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
    isDust: boolean;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

const builtRows = new Map<AssetKey, AssetRow>();

const isSameRow = (previous: AssetRow, next: AssetRow) =>
    previous.cryptoBalance.eq(next.cryptoBalance) &&
    previous.fiatValue.eq(next.fiatValue) &&
    previous.weekAgoFiatValue.eq(next.weekAgoFiatValue) &&
    previous.tokenInfo === next.tokenInfo &&
    previous.displaySymbol === next.displaySymbol &&
    previous.isDust === next.isDust;

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

export const toAssetTotal = (shown: readonly AssetHolding[]): AssetTotal | undefined => {
    if (shown.length === 0) {
        return undefined;
    }

    const { cryptoBalance, tokenInfo } = sumAssetHoldings(shown);
    // Every holding of one asset says the same about which asset it is.
    const [{ assetKey, symbol, contractAddress }] = shown as [AssetHolding];

    return {
        assetKey,
        symbol,
        contractAddress,
        displaySymbol: getAssetDisplaySymbol({ symbol, tokenInfo }),
        cryptoBalance,
        tokenInfo,
    };
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
    const asset = toAssetTotal(shown);

    if (asset === undefined) {
        return undefined;
    }

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
        (state: AssetFirstTableState) =>
            assetHoldingsIndex.read(state).getSecondaryIndex('byAsset'),
        selectHiddenAssetHoldingKeySet,
        selectEnabledNetworks,
        (_state: AssetFirstTableState, deviceState: StaticSessionId) => deviceState,
    ],
    (assetGroups, hidden, enabledNetworks, deviceState): readonly AssetTotal[] => {
        const assets = Array.from(assetGroups.values()).flatMap(group => {
            const [holding] = group.entities;

            if (holding?.deviceState !== deviceState || !enabledNetworks.includes(holding.symbol)) {
                return [];
            }

            return sumAsset(group.entities, hidden) ?? [];
        });

        return returnStableArrayIfEmpty(assets);
    },
);

export const priceAssets = (
    assets: readonly AssetTotal[],
    currentFiatRates: RatesByKey | undefined,
    lastWeekFiatRates: RatesByKey | undefined,
    baseCurrencyCode: BaseCurrencyCode,
): readonly AssetRow[] => {
    const priced = assets.map(asset => {
        const fiatRateKey = getFiatRateKey(asset.symbol, baseCurrencyCode, asset.contractAddress);
        const amount = asset.cryptoBalance.toFixed();
        const rate = currentFiatRates?.[fiatRateKey]?.rate;
        const fiatValue = toFiatCurrency({ amount, rate }) ?? ZERO_FIAT_VALUE;

        return settleRow({
            ...asset,
            fiatValue,
            weekAgoFiatValue:
                toFiatCurrency({ amount, rate: lastWeekFiatRates?.[fiatRateKey]?.rate }) ??
                ZERO_FIAT_VALUE,
            // Only a token is ever dust: a coin is the network the user enabled, and the table
            // says so whether the account holds anything or not.
            isDust:
                asset.contractAddress !== undefined &&
                isDustHolding({
                    cryptoBalance: asset.cryptoBalance,
                    decimals: asset.tokenInfo?.decimals ?? getNetworkDecimals(asset.symbol),
                    fiatValue: rate === undefined ? undefined : fiatValue,
                }),
        });
    });

    return returnStableArrayIfEmpty(priced.sort(compareRows));
};

/** The assets priced in the user's currency, most valuable first. */
export const selectAssetFirstRows = createMemoizedSelector(
    [selectAssetFirstAssets, selectCurrentFiatRates, selectLastWeekFiatRates, selectBaseCurrency],
    priceAssets,
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

/**
 * What the table renders: sections of rows, each with the heading it belongs under.
 *
 * The default arrangement is one section with no heading, so there is one way to render a table
 * and an arrangement is only a way of cutting the rows into sections.
 */
export type AssetFirstNetworkGroup = {
    symbol: NetworkSymbol;
    name: string;
    fiatValue: BigNumber;
    rows: AssetRow[];
};

export const groupAssetRowsByNetwork = (rows: readonly AssetRow[]): AssetFirstNetworkGroup[] => {
    const groupsBySymbol = new Map<NetworkSymbol, AssetFirstNetworkGroup>();

    rows.forEach(row => {
        const group = groupsBySymbol.get(row.symbol);

        if (group === undefined) {
            groupsBySymbol.set(row.symbol, {
                symbol: row.symbol,
                name: getNetworkName(row.symbol),
                fiatValue: row.fiatValue,
                rows: [row],
            });

            return;
        }

        group.fiatValue = group.fiatValue.plus(row.fiatValue);
        group.rows.push(row);
    });

    return [...groupsBySymbol.values()].sort(
        (left, right) =>
            right.fiatValue.comparedTo(left.fiatValue) || left.name.localeCompare(right.name),
    );
};

export type AssetFirstSection = {
    key: string;
    heading: { name: string; fiatValue: BigNumber } | undefined;
    rows: readonly AssetRow[];
};

/** What the table lists when the user asked not to see what an asset worth under a cent is. */
const selectLargeRows = createMemoizedSelector([selectAssetFirstRows], rows =>
    returnStableArrayIfEmpty(rows.filter(row => !row.isDust)),
);

type RowsSelector = typeof selectAssetFirstRows;

const toDefaultSections = (selectRows: RowsSelector) =>
    createMemoizedSelector([selectRows], (rows): readonly AssetFirstSection[] => [
        { key: 'all', heading: undefined, rows },
    ]);

const toNetworkSections = (selectRows: RowsSelector) =>
    createMemoizedSelector([selectRows], (rows): readonly AssetFirstSection[] =>
        groupAssetRowsByNetwork(rows).map(group => ({
            key: group.symbol,
            heading: { name: group.name, fiatValue: group.fiatValue },
            rows: group.rows,
        })),
    );

// One selector per arrangement, built once: a selector built per render would memoize nothing.
const sectionSelectors = {
    default: {
        all: toDefaultSections(selectAssetFirstRows),
        large: toDefaultSections(selectLargeRows),
    },
    networks: {
        all: toNetworkSections(selectAssetFirstRows),
        large: toNetworkSections(selectLargeRows),
    },
} satisfies Record<AssetFirstGrouping, Record<string, unknown>>;

export const selectAssetFirstSections = ({
    grouping,
    areSmallBalancesShown,
}: AssetFirstArrangement) => sectionSelectors[grouping][areSmallBalancesShown ? 'all' : 'large'];
