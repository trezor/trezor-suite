import { type TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

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
                    <TokenIcon
                        size={40}
                        symbol={asset.symbol}
                        showNetworkIcon
                        showNativeNetworkBadge
                    />
                ) : (
                    <TokenIcon
                        size={40}
                        symbol={asset.networkSymbol}
                        contractAddress={asset.contractAddress}
                        placeholder={asset.displaySymbol}
                        showNetworkIcon
                    />
                )}
                <AssetDetails
                    name={asset.displaySymbolName ?? asset.name}
                    displaySymbol={asset.displaySymbol}
                    networkSymbol={asset.networkSymbol}
                />
            </Row>
        </ItemClickableContainer>
    );
}
