import { AssetName } from '@suite/assets';
import { Translation } from '@suite/intl';
import { createAssetId } from '@suite-common/assets';
import {
    type TradingAssetOption,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';

type GlobalSendReceiveAssetDescriptionProps = {
    asset: TradingAssetOption | undefined;
};

export const GlobalSendReceiveAssetDescription = ({
    asset,
}: GlobalSendReceiveAssetDescriptionProps) => {
    if (!asset) {
        return null;
    }

    const { contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(asset.id);
    const assetName = (
        <AssetName
            assetId={createAssetId({ networkSymbol: asset.networkSymbol, contractAddress })}
        />
    );

    if (!contractAddress) {
        return assetName;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{ asset: assetName, network: asset.networkName }}
        />
    );
};
