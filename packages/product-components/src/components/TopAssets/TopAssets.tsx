import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Column, GhostContainer, Row, Text } from '@trezor/components';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { type AssetLogoProps } from '../AssetLogo/AssetLogoWithId';
import { CoinLogo } from '../CoinLogo/CoinLogo';

export type Asset = {
    id: string;
    symbol: string;
    networkSymbol: NetworkSymbol;
    displaySymbol: string;
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
            borderColor="elementBorderField"
            width="100%"
            overflow="hidden"
            data-testid={dataTestId}
        >
            <Row hasDivider dividerColor="elementBorderField" alignItems="stretch">
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
                                    symbol={asset.networkSymbol}
                                    contractAddress={asset.contractAddress}
                                    placeholder={asset.displaySymbol}
                                />
                            )}
                            <Text typographyStyle="body-sm" intent="neutral">
                                {asset.displaySymbol}
                            </Text>
                        </Column>
                    </GhostContainer>
                ))}
            </Row>
        </Box>
    );
}
