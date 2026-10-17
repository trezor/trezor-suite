import { HOME_ASSET_ROW_LIMIT, getHomeAssetRowLimit } from './homeAssetTableUtils';

describe(getHomeAssetRowLimit.name, () => {
    it('cuts a folded table to the row limit', () => {
        expect(getHomeAssetRowLimit({ isFoldable: true, isExpanded: false })).toBe(
            HOME_ASSET_ROW_LIMIT,
        );
    });

    it('shows every row once the table is expanded', () => {
        expect(getHomeAssetRowLimit({ isFoldable: true, isExpanded: true })).toBeUndefined();
    });

    it('shows every row while the table fits within the limit', () => {
        expect(getHomeAssetRowLimit({ isFoldable: false, isExpanded: false })).toBeUndefined();
    });
});
