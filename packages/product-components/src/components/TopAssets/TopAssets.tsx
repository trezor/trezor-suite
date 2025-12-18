import { Box, Column, Row, Text } from '@trezor/components';

import { AssetLogo, AssetLogoProps, shouldShowNetworkIcon } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';

export type Asset = {
    id: string;
    symbol: string;
    contractAddress: string | null;
    coingeckoId: string;
    isNativeToken: boolean;
};

export type TopAssetsProps = {
    assets: Asset[];
    onAssetClick: (asset: Asset) => void;
    logoSize?: AssetLogoProps['size'];
    'data-testid'?: string;
};

export function TopAssets({
    assets,
    logoSize = 40,
    onAssetClick,
    'data-testid': dataTestId,
}: TopAssetsProps) {
    return (
        <Box
            borderRadius={12}
            borderWidth={1}
            borderColor="baseBorderElementNeutralSoftest"
            width="100%"
            as="button"
            overflow="hidden"
            data-testid={dataTestId}
        >
            <Row hasDivider dividerColor="baseBorderElementNeutralSoftest" alignItems="stretch">
                {assets.map(asset => {
                    const displaySymbol = asset.symbol.toUpperCase();

                    return (
                        <Box
                            key={asset.id}
                            onClick={() => onAssetClick(asset)}
                            padding={{ top: 10, horizontal: 12, bottom: 6 }}
                            flex="1"
                            backgroundColorOnInteraction="stateFillElementGhostHovered"
                            cursor="pointer"
                        >
                            <Column alignItems="center" justifyContent="center" gap={4}>
                                {asset.isNativeToken ? (
                                    <CoinLogo
                                        size={logoSize}
                                        // @ts-expect-error
                                        symbol={asset.symbol}
                                        type="tokenWithNetwork"
                                        showNetworkIcon={shouldShowNetworkIcon(
                                            asset.symbol,
                                            asset.contractAddress,
                                        )}
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
                            </Column>
                        </Box>
                    );
                })}
            </Row>
        </Box>
    );
}
