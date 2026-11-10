import { Translation } from '@suite/intl';
import { getGlobalReceiveAssetDescriptionValues } from '@suite-common/receive';
import { type TradingAssetOption } from '@suite-common/trading';

import { GlobalSendReceiveAssetLabel } from './GlobalSendReceiveAssetLabel';

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

    if (networkName === undefined) {
        return <GlobalSendReceiveAssetLabel asset={asset} />;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{ asset: <GlobalSendReceiveAssetLabel asset={asset} />, network: networkName }}
        />
    );
};
