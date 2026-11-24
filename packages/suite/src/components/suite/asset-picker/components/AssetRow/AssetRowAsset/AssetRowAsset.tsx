import { AssetIcon } from '@suite/assets';
import { createAssetId } from '@suite-common/assets';
import { type TradeableAssetBalance, type TradingAssetOption } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { selectShouldShowNetworkIcon } from '@trezor/product-components';

import { useSelector } from '#src/hooks/suite/useSelector';

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
    const showNetworkIcon = useSelector(state =>
        selectShouldShowNetworkIcon(state, asset.networkSymbol, asset.contractAddress),
    );

    const tokenContract = asset.isNativeToken ? undefined : asset.contractAddress;
    const assetId = createAssetId({
        networkSymbol: asset.networkSymbol,
        contractAddress: tokenContract,
    });

    return (
        <ItemClickableContainer
            isDisabled={isDisabled}
            onClick={() => {
                onClick(asset);
            }}
        >
            <Row data-testid={dataTestId} gap={12} overflow="hidden" flex="1" minWidth={0}>
                <AssetIcon
                    size={40}
                    assetId={assetId}
                    showNetworkIcon={!tokenContract || showNetworkIcon}
                />
                <AssetDetails assetId={assetId} />
            </Row>
            {balance && (
                <Row flex="0 0 auto">
                    <AssetAmount
                        assetId={assetId}
                        amount={balance.cryptoAmount}
                        fiatAmount={balance.fiatAmount ?? undefined}
                        isFiatPrimary
                    />
                </Row>
            )}
        </ItemClickableContainer>
    );
}
