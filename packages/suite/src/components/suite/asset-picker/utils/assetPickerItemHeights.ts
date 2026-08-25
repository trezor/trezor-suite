import {
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
    EXPANDABLE_ASSET_ROW_GROUP_HEADER_HEIGHT,
} from '../constants';
import { type AssetPickerListItem } from '../types';

export const getExpandableGroupContentHeight = (rowCount: number) => rowCount * ASSET_ROW_HEIGHT;

export const getExpandableGroupHeight = (expanded: boolean, rowCount: number) =>
    EXPANDABLE_ASSET_ROW_GROUP_HEADER_HEIGHT +
    (expanded ? getExpandableGroupContentHeight(rowCount) : 0);

export const getAssetPickerItemHeight = (item: AssetPickerListItem): number => {
    switch (item.type) {
        case 'account':
        case 'token':
            return ASSET_ROW_HEIGHT;

        case 'hidden-tokens':
            return getExpandableGroupHeight(item.expanded, item.tokens.length);

        case 'low-balance-group':
        case 'non-tradable-group':
            return getExpandableGroupHeight(item.expanded, item.items.length);

        case 'group-label':
            return ASSET_ROW_GROUP_LABEL_HEIGHT;

        case 'group-space':
            return ASSET_ROW_HEIGHTS_BY_SIZE[item.size];
    }
};
