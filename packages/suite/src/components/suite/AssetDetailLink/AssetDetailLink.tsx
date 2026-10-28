import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { type SpacingValue } from '@trezor/theme';

import { useOpenAssetDetail } from './useOpenAssetDetail';

type AssetDetailLinkProps = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    gap: SpacingValue;
    children: ReactNode;
};

export const AssetDetailLink = ({
    symbol,
    contractAddress,
    gap,
    children,
}: AssetDetailLinkProps) => {
    const openAssetDetail = useOpenAssetDetail({ symbol, contractAddress });

    return (
        <Row gap={gap} onClick={openAssetDetail} cursor={openAssetDetail && 'pointer'}>
            {children}
        </Row>
    );
};
