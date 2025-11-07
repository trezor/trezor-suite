import { memo } from 'react';

import styled from 'styled-components';

const RowSpace = styled.div<{ height: number }>`
    height: ${({ height }) => height}px;
`;

type AssetGroupSpaceSize = 'md' | 'lg';
export interface AssetGroupSpaceProps {
    size: AssetGroupSpaceSize;
}

export const ASSET_ROW_HEIGHTS_BY_SIZE = {
    md: 24,
    lg: 32,
} as const satisfies Record<AssetGroupSpaceSize, number>;

export const AssetGroupSpace = memo(function AssetGroupSpaceInner({ size }: AssetGroupSpaceProps) {
    return <RowSpace height={ASSET_ROW_HEIGHTS_BY_SIZE[size]} />;
});
