import { typographyStylesBase } from '@trezor/theme';

import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

// Percentages, not content, size the columns, so the header and every virtualized row line up.
export const NFT_COL_WIDTHS = [{ minWidth: '200px' }, { width: '25%' }];

export const NFT_SEPARATOR_HEIGHT = 1;

/** A collection is one body-md line; its item is a 24px icon beside a body-sm line. */
export const NFT_COLLECTION_ROW_HEIGHT =
    HOME_ASSET_CELL_PADDING.first.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    NFT_SEPARATOR_HEIGHT;

export const NFT_ITEM_ICON_SIZE = 24;

export const NFT_ITEM_ROW_HEIGHT =
    HOME_ASSET_CELL_PADDING.first.vertical * 2 +
    Math.max(NFT_ITEM_ICON_SIZE, typographyStylesBase['body-sm'].lineHeight);

export const NFT_MORE_ROW_HEIGHT =
    HOME_ASSET_CELL_PADDING.first.vertical * 2 + typographyStylesBase['body-sm'].lineHeight;

/** How tall the list may grow before it scrolls: about nine collections. */
export const NFT_LIST_MAX_HEIGHT = 9 * NFT_COLLECTION_ROW_HEIGHT;
