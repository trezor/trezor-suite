import { type ReactNode } from 'react';

import { Card, Column, GhostContainer, Row, Text } from '@trezor/components';

import { type TokenIconProps } from '../TokenIcon/tokenIconTypes';

export type Asset = {
    id: string;
    symbol: string;
    networkSymbol: string;
    displaySymbol: string;
    contractAddress: string | null;
    coingeckoId: string;
    isNativeToken: boolean;
};

export type TopAssetsProps<TAsset extends Asset = Asset> = {
    assets: TAsset[];
    onAssetClick: (asset: TAsset) => void;
    renderIcon: (asset: TAsset, size: NonNullable<TokenIconProps['size']>) => ReactNode;
    logoSize?: TokenIconProps['size'];
    'data-testid'?: string;
};

export function TopAssets<TAsset extends Asset>({
    assets,
    logoSize = 40,
    onAssetClick,
    renderIcon,
    'data-testid': dataTestId,
}: TopAssetsProps<TAsset>) {
    return (
        <Card
            type="flat"
            width="100%"
            overflow="hidden"
            paddingType="none"
            data-testid={dataTestId}
        >
            <Row hasDivider alignItems="stretch">
                {assets.map(asset => (
                    <GhostContainer
                        key={asset.id}
                        onClick={() => onAssetClick(asset)}
                        padding={{ top: 10, horizontal: 12, bottom: 6 }}
                        borderRadius={0}
                        flex="1"
                        cursor="pointer"
                    >
                        <Column alignItems="center" justifyContent="center" gap={4}>
                            {renderIcon(asset, logoSize)}
                            <Text typographyStyle="body-sm" intent="neutral">
                                {asset.displaySymbol}
                            </Text>
                        </Column>
                    </GhostContainer>
                ))}
            </Row>
        </Card>
    );
}
