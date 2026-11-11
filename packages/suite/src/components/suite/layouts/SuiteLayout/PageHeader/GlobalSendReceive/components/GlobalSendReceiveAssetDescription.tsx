import { AssetLabel } from '@suite/assets';
import { Translation } from '@suite/intl';
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
    const contractAddress = asset.isNativeToken ? undefined : toTokenAddress(asset.contractAddress);
    // A catalog token the user does not hold has no metadata, so its catalog name is shown instead.
    const assetLabel = (
        <AssetLabel
            networkSymbol={asset.networkSymbol}
            contractAddress={contractAddress}
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
