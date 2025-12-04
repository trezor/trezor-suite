import { TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { AssetLogo, CoinLogo, shouldShowNetworkIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';

export const ASSET_ROW_ASSET_HEIGHT = 68;

export type AssetRowAssetProps = {
    asset: TradingAssetOption;
    onClick: (asset: TradingAssetOption) => void;
    dataTestId?: string;
};

export function AssetRowAsset({ asset, dataTestId, onClick }: AssetRowAssetProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                onClick(asset);
            }}
        >
            <Row data-testid={`${dataTestId}/${asset.id}`} gap={spacings.sm}>
                {asset.isNativeToken ? (
                    <CoinLogo size={40} symbol={asset.symbol} type="tokenWithNetwork" />
                ) : (
                    <AssetLogo
                        size={40}
                        coingeckoId={asset.coingeckoId}
                        symbol={asset.networkSymbol}
                        contractAddress={asset.contractAddress}
                        placeholder={asset.displaySymbol}
                        showNetworkIcon={shouldShowNetworkIcon(
                            asset.networkSymbol,
                            asset.contractAddress,
                        )}
                    />
                )}
                <AssetDetails
                    name={asset.name}
                    symbol={asset.symbol}
                    networkName={asset.networkName}
                />
            </Row>
        </ItemClickableContainer>
    );
}
