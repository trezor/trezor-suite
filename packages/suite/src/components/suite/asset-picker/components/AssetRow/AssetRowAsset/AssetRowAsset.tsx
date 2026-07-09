import { type TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { TokenLogo, shouldShowNetworkIcon } from '@trezor/product-components';

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
                <TokenLogo
                    symbol={asset.isNativeToken ? asset.symbol : asset.networkSymbol}
                    contractAddress={asset.isNativeToken ? undefined : asset.contractAddress}
                    size={40}
                    showNetworkIcon={
                        asset.isNativeToken ||
                        shouldShowNetworkIcon(asset.networkSymbol, asset.contractAddress)
                    }
                    placeholder={asset.displaySymbol}
                />
                <AssetDetails
                    name={asset.displaySymbolName ?? asset.name}
                    displaySymbol={asset.displaySymbol}
                    networkName={asset.networkName}
                />
            </Row>
        </ItemClickableContainer>
    );
}
