import { type NetworkSymbol } from '@suite-common/wallet-config';

import { getAssetListRowKey, getAssetListRows } from './getAssetListRows';

const symbols = ['btc', 'eth', 'ltc'] as NetworkSymbol[];

describe('getAssetListRows', () => {
    it('creates one asset row per symbol and flags first and last', () => {
        const rows = getAssetListRows(symbols, { isLoading: false });

        expect(rows).toEqual([
            { type: 'asset', symbol: 'btc', isFirst: true, isLast: false },
            { type: 'asset', symbol: 'eth', isFirst: false, isLast: false },
            { type: 'asset', symbol: 'ltc', isFirst: false, isLast: true },
        ]);
    });

    it('appends a loader row as the last row while loading', () => {
        const rows = getAssetListRows(symbols, { isLoading: true });

        expect(rows).toHaveLength(4);
        expect(rows[2]).toEqual({ type: 'asset', symbol: 'ltc', isFirst: false, isLast: false });
        expect(rows[3]).toEqual({ type: 'loader', isFirst: false, isLast: true });
    });

    it('marks the loader row as both first and last when there are no assets', () => {
        const rows = getAssetListRows([], { isLoading: true });

        expect(rows).toEqual([{ type: 'loader', isFirst: true, isLast: true }]);
    });

    it('returns an empty list when there are no assets and discovery is not running', () => {
        expect(getAssetListRows([], { isLoading: false })).toEqual([]);
    });

    it('derives a stable key per row type', () => {
        expect(
            getAssetListRowKey({ type: 'asset', symbol: 'btc', isFirst: true, isLast: false }),
        ).toBe('btc');
        expect(getAssetListRowKey({ type: 'loader', isFirst: false, isLast: true })).toBe(
            'discovery-loader',
        );
    });
});
