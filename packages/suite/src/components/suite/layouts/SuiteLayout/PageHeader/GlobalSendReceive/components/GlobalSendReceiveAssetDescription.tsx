import { Translation } from '@suite/intl';
import { TokenName } from '@suite/token';
import { getGlobalReceiveAssetDescriptionValues } from '@suite-common/receive';
import { toTokenAddress } from '@suite-common/tokens';
import { type TradingAssetOption } from '@suite-common/trading';

type GlobalSendReceiveAssetDescriptionProps = {
    asset: TradingAssetOption | undefined;
};

export const GlobalSendReceiveAssetDescription = ({
    asset,
}: GlobalSendReceiveAssetDescriptionProps) => {
    if (!asset) {
        return null;
    }

    const { assetName, networkName } = getGlobalReceiveAssetDescriptionValues(asset);
    // An account token's name can carry a URL, so it is masked; a catalog name is shown as is.
    const assetLabel = asset.isNativeToken ? (
        assetName
    ) : (
        <TokenName
            networkSymbol={asset.networkSymbol}
            tokenContract={toTokenAddress(asset.contractAddress)}
            fallback={assetName}
        />
    );

    if (networkName === undefined) {
        return assetLabel;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{ asset: assetLabel, network: networkName }}
        />
    );
};
