import { useServices } from '@suite-common/dependency-injection';
import { type TradingAssetOption } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';
import { TokenIcon, shouldShowNetworkIcon } from '@trezor/product-components';

import { AssetDetails } from '../AssetDetails';
import { ItemClickableContainer } from '../ItemClickableContainer';

export type AssetRowAssetProps = {
    asset: TradingAssetOption;
    onClick: (asset: TradingAssetOption) => void;
    dataTestId?: string;
};

export function AssetRowAsset({ asset, dataTestId, onClick }: AssetRowAssetProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    return (
        <ItemClickableContainer
            onClick={() => {
                onClick(asset);
            }}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden" maxWidth="100%">
                {asset.isNativeToken ? (
                    <TokenIcon size={40} symbol={asset.symbol} showNetworkIcon />
                ) : (
                    <TokenIcon
                        size={40}
                        symbol={asset.networkSymbol}
                        contractAddress={asset.contractAddress}
                        placeholder={asset.displaySymbol}
                        showNetworkIcon={shouldShowNetworkIcon(
                            networkConfigDeps,
                            asset.networkSymbol,
                            asset.contractAddress,
                        )}
                    />
                )}
                <AssetDetails
                    name={asset.displaySymbolName ?? asset.name}
                    displaySymbol={asset.displaySymbol}
                    networkName={asset.networkName}
                />
            </Row>
        </ItemClickableContainer>
    );
}
