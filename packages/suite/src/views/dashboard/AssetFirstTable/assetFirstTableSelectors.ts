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
import { type TokenInfo } from '@trezor/blockchain-link-types';
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

/**
 * One line of the table: what the wallet holds of one asset on one network, and what it is worth.
 *
 * Everything the row renders and everything the total adds up is in here, computed once, so the
 * two cannot say different things about the same asset.
 */
export type AssetRow = {
    assetKey: AssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    /** What the asset is across networks — ETH, USDC — which orders holdings worth the same. */
    displaySymbol: string;
    cryptoBalance: BigNumber;
    tokenInfo: TokenInfo | undefined;
    fiatValue: BigNumber;
    /** The same holding priced a week ago, for the change shown beside the total. */
    weekAgoFiatValue: BigNumber;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

// A row is handed to a memoized component, so a row that did not change has to be the same object.
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

/**
 * Orders the rows by what each holding is worth, most valuable first — each line on its own, so a
 * little Ether on Arbitrum ranks where its own value puts it and not behind the Ether on Ethereum.
 *
 * Holdings worth the same, and the rows with no rate to price them, keep a settled order by asset
 * and network rather than whichever order the accounts happened to arrive in.
 */
const compareRows = (left: AssetRow, right: AssetRow) =>
    right.fiatValue.comparedTo(left.fiatValue) ||
    left.displaySymbol.localeCompare(right.displaySymbol) ||
    left.symbol.localeCompare(right.symbol);

/**
 * Every asset the selected wallet holds, as one row per asset and network, ordered for display.
 *
 * Which assets exist comes from `accountsIndex`; what belongs on the dashboard is settled here,
 * because it depends on state the index knows nothing about — which networks the user enabled, and
 * which tokens have a definition. Memoized on the index's snapshot, so the walk is done once per
 * write to the accounts rather than once per render.
 */
export const selectAssetFirstRows = createMemoizedSelector(
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

            rows.push(
                settleRow({
                    assetKey,
                    symbol,
                    contractAddress,
                    displaySymbol,
                    cryptoBalance,
                    tokenInfo,
                    fiatValue,
                    weekAgoFiatValue:
                        toFiatCurrency({
                            amount: cryptoBalance.toFixed(),
                            rate: lastWeekFiatRates?.[fiatRateKey]?.rate,
                        }) ?? ZERO_FIAT_VALUE,
                }),
            );
        });

        return returnStableArrayIfEmpty(rows.sort(compareRows));
    },
);

export type AssetFirstTotals = {
    fiatValue: BigNumber;
    /**
     * What the same holdings have gained or lost against their rate a week ago, or nothing when no
     * rate for a week ago is known — "no data" and "no change" are not the same claim to make.
     */
    weekChange: BigNumber | undefined;
    /** The same change as a share of what the holdings were worth then. */
    weekChangePercent: BigNumber | undefined;
};

/**
 * What the given rows are worth, together.
 *
 * Takes the rows rather than deciding for itself which assets count, so the total is over exactly
 * what the table was given — one list, one answer, and a filter applied to that list moves the
 * total with it.
 *
 * Pass the filtered rows rather than the mounted ones: a table that paginates or virtualizes still
 * holds the assets it is not showing right now.
 */
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
 * The rows arranged the way the table was asked to arrange them.
 *
 * One selector per arrangement, chosen by the mode, rather than a selector built per render: the
 * table renders whichever shape it is handed, and a mode that did not change hands back the same
 * groups, so the rows keep their identities and a memoized row is not re-rendered.
 *
 * Both arrangements read `selectAssetFirstRows`, so grouping cannot disagree with the total above
 * the table about which assets there are — a group is a slice of that one list.
 */
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
