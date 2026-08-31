import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';

import { getGlobalReceiveAssetDescriptionValues } from '../globalReceiveAssetUtils';

type GlobalReceiveAssetDescriptionProps = {
    asset: TradingAssetOption | undefined;
};

export const GlobalReceiveAssetDescription = ({ asset }: GlobalReceiveAssetDescriptionProps) => {
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
