import styled from 'styled-components';

import { Text } from '@trezor/components';
import { borders, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';

import { AssetLogo, AssetLogoProps, shouldShowNetworkIcon } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';

const Container = styled.div<{ $itemsCount: number }>`
    display: grid;
    grid-template-columns: repeat(${({ $itemsCount }) => $itemsCount}, 1fr);
    border: 1px solid ${({ theme }) => mapElevationToBorder({ $elevation: 1, theme })};
    border-radius: ${borders.radii.md};
    align-items: center;
    width: 100%;
    overflow: hidden;
    position: relative;
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
    transition: background-color 150ms ease-in-out;

    &:hover {
        background-color: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }
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
    dataTestId?: string;
}

export function TopAssets({ assets, logoSize = 40, onAssetClick, dataTestId }: TopAssetsProps) {
    return (
        <Container $itemsCount={assets.length}>
            {assets.map((asset, index) => {
                const displaySymbol = asset.symbol.toUpperCase();

                return (
                    <Item
                        key={asset.id}
                        $isLast={index === assets.length - 1}
                        onClick={() => onAssetClick(asset)}
                        data-testid={`${dataTestId}/${asset.id}`}
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
                                showNetworkIcon={shouldShowNetworkIcon(
                                    asset.symbol,
                                    asset.contractAddress,
                                )}
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
