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

    const { assetName, networkName } = getGlobalReceiveAssetDescriptionValues(asset);

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
