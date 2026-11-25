import { ASSET_TABLE_ROW_LIMIT, getAssetTableRowLimit } from './homeAssetTableUtils';

describe(getAssetTableRowLimit.name, () => {
    it('cuts a folded table to the row limit', () => {
        expect(getAssetTableRowLimit({ isFoldable: true, isExpanded: false })).toBe(
            ASSET_TABLE_ROW_LIMIT,
        );
    });

    it('shows every row once the table is expanded', () => {
        expect(getAssetTableRowLimit({ isFoldable: true, isExpanded: true })).toBeUndefined();
    });

    it('shows every row while the table fits within the limit', () => {
        expect(getAssetTableRowLimit({ isFoldable: false, isExpanded: false })).toBeUndefined();
    });
});
