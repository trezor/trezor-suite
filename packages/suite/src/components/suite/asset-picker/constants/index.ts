import type { AssetGroupSpaceSize } from 'src/components/suite/asset-picker/types';

export const ASSET_ROW_HEIGHT = 68;
export const ASSET_ROW_GROUP_LABEL_HEIGHT = 28;
export const ASSET_ROW_HEIGHTS_BY_SIZE = {
    md: 24,
    lg: 32,
} as const satisfies Record<AssetGroupSpaceSize, number>;

export const EXPANDABLE_ASSET_ROW_GROUP_HEADER_HEIGHT = 50;
