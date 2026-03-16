import { type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';
import { AssetLogo, CoinLogo, shouldShowNetworkIcon } from '@trezor/product-components';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';

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
            <Row data-testid={dataTestId} gap={12} overflow="hidden" maxWidth="100%">
                {asset.isNativeToken ? (
                    <CoinLogo
                        size={40}
                        symbol={asset.symbol as NetworkSymbol}
                        type="tokenWithNetwork"
                    />
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
                    displaySymbol={asset.displaySymbol}
                    networkName={asset.networkName}
                />
            </Row>
        </ItemClickableContainer>
    );
}
