import {
    ASSET_GROUP_CARD_PADDING,
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
    EXPANDABLE_ASSET_ROW_GROUP_HEADER_HEIGHT,
} from '../constants';
import { type AssetPickerListItem } from '../types';

type MeasurableAssetGroup = { expanded: boolean; items: readonly unknown[] };

export const getExpandableGroupContentHeight = (rowCount: number) => rowCount * ASSET_ROW_HEIGHT;

export const getExpandableGroupHeight = (expanded: boolean, rowCount: number) =>
    EXPANDABLE_ASSET_ROW_GROUP_HEADER_HEIGHT +
    (expanded ? getExpandableGroupContentHeight(rowCount) : 0);

const getAssetGroupsCardHeight = (groups: readonly MeasurableAssetGroup[]) =>
    groups.reduce(
        (height, { expanded, items }) => height + getExpandableGroupHeight(expanded, items.length),
        2 * ASSET_GROUP_CARD_PADDING,
    );

export const getAssetPickerItemHeight = (item: AssetPickerListItem): number => {
    switch (item.type) {
        case 'account':
        case 'token':
            return ASSET_ROW_HEIGHT;

        case 'hidden-tokens':
            return getAssetGroupsCardHeight([{ expanded: item.expanded, items: item.tokens }]);

        case 'asset-groups':
            return getAssetGroupsCardHeight(item.groups);

        case 'group-label':
            return ASSET_ROW_GROUP_LABEL_HEIGHT;

        case 'group-space':
            return ASSET_ROW_HEIGHTS_BY_SIZE[item.size];
    }
};
