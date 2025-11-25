import styled from 'styled-components';

import { Text } from '@trezor/components';
import { borders, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';

import { AssetLogo, AssetLogoProps } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';

const Container = styled.div<{ $itemsCount: number }>`
    display: grid;
    grid-template-columns: repeat(${({ $itemsCount }) => $itemsCount}, 1fr);
    border: 1px solid ${({ theme }) => mapElevationToBorder({ $elevation: 1, theme })};
    border-radius: ${borders.radii.sm};
    align-items: center;
    width: 100%;
`;

const Item = styled('button')<{ $isLast: boolean }>`
    border: unset;
    background: unset;
    box-shadow: unset;
    cursor: pointer;
    border-right: ${({ $isLast, theme }) =>
        !$isLast && `1px solid ${mapElevationToBorder({ $elevation: 1, theme })}`};
    width: 100%;
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.xxs};
    flex-direction: column;
    padding: ${spacings.xs * 1.25}px ${spacings.xs * 1.5}px ${spacings.xs * 0.75}px;
`;

export type Asset = {
    id: string;
    symbol: string;
    contractAddress: string | null;
    coingeckoId: string;
    isNativeToken: boolean;
};
export interface TopAssetsProps {
    assets: Asset[];
    onAssetClick: (asset: Asset) => void;
    logoSize?: AssetLogoProps['size'];
    className?: string;
}

export function TopAssets({ assets, logoSize = 40, onAssetClick, className }: TopAssetsProps) {
    return (
        <Container $itemsCount={assets.length} className={className}>
            {assets.map((asset, index) => {
                const displaySymbol = asset.symbol.toUpperCase();

                return (
                    <Item
                        key={asset.id}
                        $isLast={index === assets.length - 1}
                        onClick={() => onAssetClick(asset)}
                    >
                        {asset.isNativeToken ? (
                            <CoinLogo
                                size={logoSize}
                                // @ts-expect-error
                                symbol={asset.symbol}
                                type="tokenWithNetwork"
                            />
                        ) : (
                            <AssetLogo
                                size={logoSize}
                                coingeckoId={asset.coingeckoId}
                                symbol={asset.symbol}
                                contractAddress={asset.contractAddress}
                                placeholder={displaySymbol}
                            />
                        )}

                        <Text typographyStyle="hint" variant="default">
                            {displaySymbol}
                        </Text>
                    </Item>
                );
            })}
        </Container>
    );
}
