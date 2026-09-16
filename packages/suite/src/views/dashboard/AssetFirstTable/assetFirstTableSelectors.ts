import { type DeviceRootState, selectDeviceStaticSessionId } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetHolding,
    type AssetHoldingsRootState,
    type AssetKey,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    assetHoldingsIndex,
    parseAssetKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

import { getAssetDisplaySymbol, sumAssetHoldings } from './assetFirstTableUtils';

export type AssetFirstTableState = AssetHoldingsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

type AssetRow = {
    assetKey: AssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    fiatValue: BigNumber;
    /** The same holding priced a week ago, for the change shown beside the total. */
    weekAgoFiatValue: BigNumber;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

/**
 * Orders the rows the way the design reads: the assets a wallet holds most of first, and every
 * network holding the same asset together underneath it — Ether on Ethereum next to Ether on
 * Arbitrum, however little of it is on either.
 */
const compareRows = (
    left: AssetRow,
    right: AssetRow,
    fiatValueByDisplaySymbol: Map<string, BigNumber>,
) => {
    const leftAssetValue = fiatValueByDisplaySymbol.get(left.displaySymbol) ?? ZERO_FIAT_VALUE;
    const rightAssetValue = fiatValueByDisplaySymbol.get(right.displaySymbol) ?? ZERO_FIAT_VALUE;

    return (
        rightAssetValue.comparedTo(leftAssetValue) ||
        left.displaySymbol.localeCompare(right.displaySymbol) ||
        right.fiatValue.comparedTo(left.fiatValue) ||
        left.symbol.localeCompare(right.symbol)
    );
};

/**
 * Every asset the selected wallet holds, as one row per asset and network, ordered for display.
 *
 * Which assets exist comes from `accountsIndex`; what belongs on the dashboard is settled here,
 * because it depends on state the index knows nothing about — which networks the user enabled, and
 * which tokens have a definition. Memoized on the index's snapshot, so the walk is done once per
 * write to the accounts rather than once per render.
 */
const selectAssetFirstRows = createMemoizedSelector(
    [
        (state: AssetFirstTableState) => assetHoldingsIndex.read(state).groups.byAsset,
        selectDeviceStaticSessionId,
        selectEnabledNetworks,
        selectCurrentFiatRates,
        selectLastWeekFiatRates,
        selectBaseCurrency,
    ],
    (
        assetGroups,
        deviceStaticSessionId,
        enabledNetworks,
        currentFiatRates,
        lastWeekFiatRates,
        baseCurrencyCode,
    ): readonly AssetRow[] => {
        if (deviceStaticSessionId === null) {
            return returnStableArrayIfEmpty([]);
        }

        const rows: AssetRow[] = [];
        const fiatValueByDisplaySymbol = new Map<string, BigNumber>();

        assetGroups.forEach((group, assetKey) => {
            const parts = parseAssetKey(assetKey);

            if (
                parts?.deviceState !== deviceStaticSessionId ||
                !enabledNetworks.includes(parts.symbol)
            ) {
                return;
            }

            const { symbol, contractAddress } = parts;

            const visibleHoldings = group.entities.filter(
                (holding: AssetHolding) => holding.isAccountVisible,
            );

            if (visibleHoldings.length === 0) {
                return;
            }

            const { cryptoBalance, tokenInfo } = sumAssetHoldings(visibleHoldings);
            const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
            const fiatValue =
                toFiatCurrency({
                    amount: cryptoBalance.toFixed(),
                    rate: currentFiatRates?.[fiatRateKey]?.rate,
                }) ?? ZERO_FIAT_VALUE;
            const displaySymbol = getAssetDisplaySymbol({ symbol, tokenInfo });

            rows.push({
                assetKey,
                symbol,
                contractAddress,
                displaySymbol,
                fiatValue,
                weekAgoFiatValue:
                    toFiatCurrency({
                        amount: cryptoBalance.toFixed(),
                        rate: lastWeekFiatRates?.[fiatRateKey]?.rate,
                    }) ?? ZERO_FIAT_VALUE,
            });
            fiatValueByDisplaySymbol.set(
                displaySymbol,
                (fiatValueByDisplaySymbol.get(displaySymbol) ?? ZERO_FIAT_VALUE).plus(fiatValue),
            );
        });

        return returnStableArrayIfEmpty(
            rows.sort((left, right) => compareRows(left, right, fiatValueByDisplaySymbol)),
        );
    },
);

export const selectAssetFirstTableKeys = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): readonly AssetKey[] => returnStableArrayIfEmpty(rows.map(row => row.assetKey)),
);

/**
 * The account behind the wallet's largest holding — what the page's Swap, Receive and Send open on,
 * since those routes are account-scoped and the header is not.
 */
/**
 * The account behind one asset — what a page's Swap, Receive and Send open on, since those routes
 * are account-scoped and an asset is not.
 */
export const selectAssetFirstAccountKey = createMemoizedSelector(
    [
        (state: AssetFirstTableState) => assetHoldingsIndex.read(state).groups.byAsset,
        (_state: AssetFirstTableState, assetKey: AssetKey | undefined) => assetKey,
    ],
    (assetGroups, assetKey) =>
        assetKey === undefined
            ? undefined
            : assetGroups
                  .get(assetKey)
                  ?.entities.find((holding: AssetHolding) => holding.isAccountVisible)?.accountKey,
);

export type AssetFirstTotals = {
    fiatValue: BigNumber;
    /**
     * What the same holdings have gained or lost against their rate a week ago, or nothing when no
     * rate for a week ago is known — "no data" and "no change" are not the same claim to make.
     */
    weekChange: BigNumber | undefined;
};

const selectAssetFirstRowsByKey = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): ReadonlyMap<AssetKey, AssetRow> => new Map(rows.map(row => [row.assetKey, row])),
);

/**
 * What the assets in `assetKeys` are worth, together.
 *
 * Takes the keys rather than deciding for itself which assets count, so the total is over exactly
 * the rows the table was given — one list, one answer. A filter applied to that list moves the
 * total with it, and the two cannot drift apart.
 *
 * Pass the filtered list rather than what is mounted: a table that paginates or virtualizes still
 * holds the assets it is not showing right now.
 */
export const selectAssetFirstTotals = createMemoizedSelector(
    [
        selectAssetFirstRowsByKey,
        (_state: AssetFirstTableState, assetKeys: readonly AssetKey[]) => assetKeys,
    ],
    (rowsByKey, assetKeys): AssetFirstTotals => {
        const rows = assetKeys
            .map(assetKey => rowsByKey.get(assetKey))
            .filter(isNotNullOrUndefined);
        const fiatValue = rows.reduce((total, row) => total.plus(row.fiatValue), ZERO_FIAT_VALUE);

        if (!rows.some(row => row.weekAgoFiatValue.gt(0))) {
            return { fiatValue, weekChange: undefined };
        }

        const weekAgoFiatValue = rows.reduce(
            (total, row) => total.plus(row.weekAgoFiatValue),
            ZERO_FIAT_VALUE,
        );

        return { fiatValue, weekChange: fiatValue.minus(weekAgoFiatValue) };
    },
);
