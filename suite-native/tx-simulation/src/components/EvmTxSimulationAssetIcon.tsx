import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import { Icon, TokenIcon } from '@suite-native/icons';

import { type EvmTxSimulationAssetProps } from './EvmTxSimulationAssetTypes';

export const EvmTxSimulationAssetIcon = ({
    assetDiff,
    assetExposure,
    network,
}: EvmTxSimulationAssetProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const asset = (assetDiff || assetExposure)?.asset;
    const assetType = (assetDiff || assetExposure)?.asset_type;
    const coinSymbol = asset?.symbol?.toLowerCase();

    if (assetType === 'NATIVE' && coinSymbol && isNetworkSymbol(networkConfigDeps, coinSymbol)) {
        return <TokenIcon symbol={coinSymbol} size="small" />;
    }

    if (asset?.symbol && 'address' in asset && network.coingeckoId) {
        return (
            <TokenIcon
                symbol={network.symbol}
                contractAddress={asset.address.toLowerCase()}
                size="small"
                showNetworkIcon
            />
        );
    }

    return <Icon name="coins" size="small" />;
};
