import { type TradeableAssetBalance, type TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { TokenIcon, shouldShowNetworkIcon } from '@trezor/product-components';

import { AssetDetails } from '../AssetDetails';
import { AssetAmount } from '../AssetRowToken/AssetAmount';
import { ItemClickableContainer } from '../ItemClickableContainer';

export type AssetRowAssetProps = {
    asset: TradingAssetOption;
    onClick: (asset: TradingAssetOption) => void;
    balance?: TradeableAssetBalance;
    dataTestId?: string;
};

export function AssetRowAsset({ asset, balance, dataTestId, onClick }: AssetRowAssetProps) {
    return (
        <ItemClickableContainer
            onClick={() => {
                onClick(asset);
            }}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden" flex="1" minWidth={0}>
                {asset.isNativeToken ? (
                    <TokenIcon size={40} symbol={asset.symbol} showNetworkIcon />
                ) : (
                    <TokenIcon
                        size={40}
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
                    name={asset.displaySymbolName ?? asset.name}
                    displaySymbol={asset.displaySymbol}
                    networkName={asset.networkName}
                />
            </Row>
            {balance && (
                <Row flex="0 0 auto">
                    <AssetAmount
                        symbol={asset.displaySymbol}
                        amount={balance.cryptoAmount}
                        contractAddress={asset.contractAddress}
                        fiatAmount={balance.fiatAmount ?? undefined}
                        isFiatPrimary
                    />
                </Row>
            )}
        </ItemClickableContainer>
    );
}
