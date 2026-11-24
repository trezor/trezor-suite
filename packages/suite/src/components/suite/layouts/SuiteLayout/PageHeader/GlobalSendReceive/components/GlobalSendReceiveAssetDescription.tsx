import { AssetName } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type AssetId, parseAssetId } from '@suite-common/asset-types';
import { useFormatters } from '@suite-common/formatters';

type GlobalSendReceiveAssetDescriptionProps = {
    assetId: AssetId | undefined;
};

export const GlobalSendReceiveAssetDescription = ({
    assetId,
}: GlobalSendReceiveAssetDescriptionProps) => {
    const { NetworkNameFormatter } = useFormatters();
    if (!assetId) {
        return null;
    }

    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const assetName = <AssetName assetId={assetId} />;

    if (!contractAddress) {
        return assetName;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{ asset: assetName, network: <NetworkNameFormatter value={networkSymbol} /> }}
        />
    );
};
