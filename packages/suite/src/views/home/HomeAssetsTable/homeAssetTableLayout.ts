import { type Padding } from '@trezor/components';

export const HOME_ASSET_CELL_PADDING = {
    first: { vertical: 12, left: 20, right: 20 },
    last: { vertical: 12, left: 20, right: 20 },
} satisfies Record<string, Padding>;

// Percentages, not content, size the columns, so separate tables of the same width line up.
export const HOME_ASSET_COL_WIDTHS = [{ minWidth: '200px' }, { width: '25%' }, { width: '25%' }];

export const HOME_ASSET_BALANCE_MAX_WIDTH = '180px';
