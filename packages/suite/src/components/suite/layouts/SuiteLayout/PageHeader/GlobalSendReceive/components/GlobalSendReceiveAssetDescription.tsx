import { AssetName } from '@suite/assets';
import { Translation } from '@suite/intl';
import { getGlobalReceiveAssetDescriptionValues } from '@suite-common/receive';
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

    const { networkName } = getGlobalReceiveAssetDescriptionValues(asset);
    const assetName = (
        <AssetName
            networkSymbol={asset.networkSymbol}
            contractAddress={asset.isNativeToken ? undefined : asset.contractAddress}
        />
    );

    if (networkName === undefined) {
        return assetName;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{ asset: assetName, network: networkName }}
        />
    );
};
