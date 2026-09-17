import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BigNumber } from '@trezor/utils';

import { type AssetRow } from './assetFirstTableSelectors';
import { getNetworkName } from './assetFirstTableUtils';

export type AssetFirstGrouping = 'default' | 'networks';

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
