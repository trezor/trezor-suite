import { TokenName } from '@suite/token';
import { getGlobalReceiveAssetDescriptionValues } from '@suite-common/receive';
import { toTokenAddress } from '@suite-common/tokens';
import { type TradingAssetOption } from '@suite-common/trading';

type GlobalSendReceiveAssetLabelProps = {
    asset: TradingAssetOption;
};

/** An account token's name can carry a URL, so it is masked; a catalog name is shown as is. */
export const GlobalSendReceiveAssetLabel = ({ asset }: GlobalSendReceiveAssetLabelProps) => {
    const { assetName } = getGlobalReceiveAssetDescriptionValues(asset);

    if (asset.isNativeToken) return assetName;

    return (
        <TokenName
            networkSymbol={asset.networkSymbol}
            tokenContract={toTokenAddress(asset.contractAddress)}
            fallback={assetName}
        />
    );
};
