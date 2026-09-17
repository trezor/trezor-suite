import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BigNumber } from '@trezor/utils';

import { type AssetRow } from './assetFirstTableSelectors';
import { getNetworkName } from './assetFirstTableUtils';

/** How the table arranges the rows it was given. */
export type AssetFirstGrouping = 'default' | 'networks';

export type AssetFirstNetworkGroup = {
    symbol: NetworkSymbol;
    name: string;
    /** What the wallet holds on this network, over the rows in the group. */
    fiatValue: BigNumber;
    rows: AssetRow[];
};

/**
 * The same rows, gathered under the network they are held on.
 *
 * Nothing is added or left out — a group is a slice of the list the table was already given, so
 * the totals still add up to the one above the table. Networks are ordered by what is held on
 * them, and the rows inside a group keep the order they arrived in, which is by value.
 */
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
