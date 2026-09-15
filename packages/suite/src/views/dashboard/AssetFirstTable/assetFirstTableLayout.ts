import { type Padding } from '@trezor/components';

/**
 * The outer cells carry the page's own horizontal padding, because the table is wider than the
 * content around it: the lines between assets run to the edge of the page while the text under
 * "Asset" stays aligned with the balance above it.
 */
export const ASSET_FIRST_CELL_PADDING = {
    first: { vertical: 12, left: 16, right: 20 },
    last: { vertical: 12, left: 20, right: 16 },
} satisfies Record<string, Padding>;
