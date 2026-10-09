import { useSelector } from 'react-redux';

import { type TradeableAssetBalance, type TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import {
    TokenIcon,
    injectHasNetworkIcon,
    selectNetworkConfigs,
    shouldShowNetworkIcon,
} from '@trezor/product-components';

import { AssetDetails } from '../AssetDetails';
import { AssetAmount } from '../AssetRowToken/AssetAmount';
import { ItemClickableContainer } from '../ItemClickableContainer';

export type AssetRowAssetProps = {
    asset: TradingAssetOption;
    onClick: (asset: TradingAssetOption) => void;
    balance?: TradeableAssetBalance;
    dataTestId?: string;
    isDisabled?: boolean;
};

export function AssetRowAsset({
    asset,
    balance,
    dataTestId,
    isDisabled,
    onClick,
}: AssetRowAssetProps) {
    const deps = useServices(injectHasNetworkIcon);
    const networks = useSelector(selectNetworkConfigs);

    return (
        <ItemClickableContainer
            isDisabled={isDisabled}
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
                            deps,
                            { networks },
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
