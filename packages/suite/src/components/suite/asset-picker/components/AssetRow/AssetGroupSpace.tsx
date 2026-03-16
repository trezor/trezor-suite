import { Box } from '@trezor/components';

import { ASSET_ROW_HEIGHTS_BY_SIZE } from 'src/components/suite/asset-picker/constants';
import { type AssetGroupSpaceSize } from 'src/components/suite/asset-picker/types';

export type AssetGroupSpaceProps = {
    size: AssetGroupSpaceSize;
};

export function AssetGroupSpace({ size }: AssetGroupSpaceProps) {
    return <Box height={ASSET_ROW_HEIGHTS_BY_SIZE[size]} />;
}
