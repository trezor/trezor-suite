import { isNetworkSymbol } from '@suite-common/wallet-config';
import { AssetIcon } from '@suite-native/assets';
import { Icon } from '@suite-native/icons';

import { type EvmTxSimulationAssetProps } from './EvmTxSimulationAssetTypes';

export const EvmTxSimulationAssetIcon = ({
    assetDiff,
    assetExposure,
    network,
}: EvmTxSimulationAssetProps) => {
    const asset = (assetDiff || assetExposure)?.asset;
    const assetType = (assetDiff || assetExposure)?.asset_type;
    const coinSymbol = asset?.symbol?.toLowerCase();

    if (assetType === 'NATIVE' && coinSymbol && isNetworkSymbol(coinSymbol)) {
        return <AssetIcon networkSymbol={coinSymbol} size="small" />;
    }

    if (asset?.symbol && 'address' in asset && network.coingeckoId) {
        return (
            <AssetIcon
                networkSymbol={network.symbol}
                contractAddress={asset.address}
                size="small"
                showNetworkIcon
            />
        );
    }

    return <Icon name="coins" size="small" />;
};
