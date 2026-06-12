import { isNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Icon, TokenIcon, TokenIconWithNetwork } from '@suite-native/icons';

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
        return <TokenIcon symbol={coinSymbol} size="small" />;
    }

    if (asset?.symbol && 'address' in asset && network.coingeckoId) {
        return (
            <TokenIconWithNetwork
                symbol={network.symbol}
                contractAddress={asset.address.toLowerCase() as TokenAddress}
                size="small"
            />
        );
    }

    return <Icon name="coins" size="small" />;
};
