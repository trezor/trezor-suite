import { type Padding } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';

export const HOME_ASSET_CELL_PADDING = {
    first: { vertical: 12, left: 20, right: 20 },
    last: { vertical: 12, left: 20, right: 20 },
} satisfies Record<string, Padding>;

// Percentages, not content, size the columns, so separate tables of the same width line up.
export const HOME_ASSET_COL_WIDTHS = [{ minWidth: '200px' }, { width: '25%' }, { width: '25%' }];

export const HOME_ASSET_BALANCE_MAX_WIDTH = '180px';

export const HOME_ASSET_LINE_GAP = 2;

/** A cell is two lines, the first in body-md and the second in body-sm. */
export const HOME_ASSET_ROW_HEIGHT =
    HOME_ASSET_CELL_PADDING.first.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    HOME_ASSET_LINE_GAP +
    typographyStylesBase['body-sm'].lineHeight;
