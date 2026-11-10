import { Box } from '@trezor/components';

import { ASSET_ROW_HEIGHTS_BY_SIZE } from '../../constants';
import { type AssetGroupSpaceSize } from '../../types';

export type AssetGroupSpaceProps = {
    size: AssetGroupSpaceSize;
};

export function AssetGroupSpace({ size }: AssetGroupSpaceProps) {
    return <Box height={ASSET_ROW_HEIGHTS_BY_SIZE[size]} />;
}
