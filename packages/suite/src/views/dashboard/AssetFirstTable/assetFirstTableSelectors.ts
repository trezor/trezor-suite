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
import { BigNumber } from '@trezor/utils';

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
export const selectAssetFirstLargestHoldingAccountKey = createMemoizedSelector(
    [
        selectAssetFirstRows,
        (state: AssetFirstTableState) => assetHoldingsIndex.read(state).groups.byAsset,
    ],
    (rows, assetGroups) => {
        const [largestHolding] = rows;

        if (largestHolding === undefined) {
            return undefined;
        }

        return assetGroups
            .get(largestHolding.assetKey)
            ?.entities.find((holding: AssetHolding) => holding.isAccountVisible)?.accountKey;
    },
);

export type AssetFirstTotals = {
    fiatValue: BigNumber;
    /**
     * What the same holdings have gained or lost against their rate a week ago, or nothing when no
     * rate for a week ago is known — "no data" and "no change" are not the same claim to make.
     */
    weekChange: BigNumber | undefined;
};

/**
 * What the wallet is worth, added up from the rows the table shows.
 *
 * Deliberately the same arithmetic as the rows rather than `useTotalFiatBalance`, so the number at
 * the top of the page is the sum of the numbers underneath it.
 */
export const selectAssetFirstTotals = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): AssetFirstTotals => {
        const fiatValue = rows.reduce((total, row) => total.plus(row.fiatValue), ZERO_FIAT_VALUE);
        const hasWeekAgoRates = rows.some(row => row.weekAgoFiatValue.gt(0));

        if (!hasWeekAgoRates) {
            return { fiatValue, weekChange: undefined };
        }

        const weekAgoFiatValue = rows.reduce(
            (total, row) => total.plus(row.weekAgoFiatValue),
            ZERO_FIAT_VALUE,
        );

        return { fiatValue, weekChange: fiatValue.minus(weekAgoFiatValue) };
    },
);
