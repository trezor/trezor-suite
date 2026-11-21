import { AssetName } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type AssetId } from '@suite-common/tokens';
import { getNetwork } from '@suite-common/wallet-config';

type GlobalSendReceiveAssetDescriptionProps = {
    assetId: AssetId | undefined;
};

export const GlobalSendReceiveAssetDescription = ({
    assetId,
}: GlobalSendReceiveAssetDescriptionProps) => {
    if (!assetId) {
        return null;
    }

    const { networkSymbol, contractAddress } = assetId;
    const networkName = contractAddress ? getNetwork(networkSymbol).name : undefined;
    const assetName = <AssetName networkSymbol={networkSymbol} contractAddress={contractAddress} />;

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
