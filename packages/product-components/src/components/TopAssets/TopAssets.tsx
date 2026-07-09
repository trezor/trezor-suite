import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, Column, GhostContainer, Row, Text } from '@trezor/components';

import { type AssetLogoProps } from '../AssetLogo/AssetLogoWithId';
import { TokenLogo } from '../TokenLogo/TokenLogo';
import { shouldShowNetworkIcon } from '../TokenLogo/tokenLogoUtils';

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
                            <TokenLogo
                                // @ts-expect-error
                                symbol={asset.isNativeToken ? asset.symbol : asset.networkSymbol}
                                contractAddress={
                                    asset.isNativeToken ? undefined : asset.contractAddress
                                }
                                size={logoSize}
                                showNetworkIcon={
                                    asset.isNativeToken ||
                                    shouldShowNetworkIcon(
                                        asset.networkSymbol,
                                        asset.contractAddress,
                                    )
                                }
                                placeholder={asset.displaySymbol}
                            />

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
