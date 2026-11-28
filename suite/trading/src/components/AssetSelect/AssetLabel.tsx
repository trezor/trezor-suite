import { AssetIcon, AssetSymbol } from '@suite/assets';
import {
    type TradingAssetOption,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { Row } from '@trezor/components';

type AssetLabelProps = {
    asset: TradingAssetOption;
    symbolTestId?: string;
};

export const AssetLabel = ({ asset, symbolTestId }: AssetLabelProps) => {
    const { contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(asset.id);

    return (
        <Row gap={8} alignItems="center">
            <AssetIcon
                size={24}
                networkSymbol={asset.networkSymbol}
                contractAddress={contractAddress}
                showNetworkIcon
            />
            <span data-testid={symbolTestId}>
                <AssetSymbol
                    networkSymbol={asset.networkSymbol}
                    contractAddress={contractAddress}
                    isTruncated
                />
            </span>
        </Row>
    );
};
