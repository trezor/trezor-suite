import styled from 'styled-components';

import { ASSET_ROW_HEIGHTS, AssetRowProps } from '../../constants';

const RowSpace = styled.div<{ height: number }>`
    height: ${({ height }) => height}px;
`;

interface AssetGroupSpaceProps {
    type: Extract<AssetRowProps['type'], 'group-space-md' | 'group-space-lg'>;
}

export function AssetGroupSpace({ type }: AssetGroupSpaceProps) {
    return <RowSpace height={ASSET_ROW_HEIGHTS[type]} />;
}
