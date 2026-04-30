import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { IconCircle } from '@trezor/components';
import { AssetLogo, type AssetLogoSize, CoinLogo, isCoinSymbol } from '@trezor/product-components';

interface TxSimulationAssetLogoProps {
    asset?: EvmAssetDiff['asset'] | EvmAssetExposure['asset'];
    assetType?: EvmAssetDiff['asset_type'] | EvmAssetExposure['asset_type'];
    network: Network;
    size?: AssetLogoSize;
}

export function TxSimulationAssetLogo({
    asset,
    assetType,
    network,
    size = 32,
}: TxSimulationAssetLogoProps) {
    const coinSymbol = asset?.symbol?.toLowerCase();
    const iconCircleSize = size === 20 ? 24 : size;

    if (assetType === 'NATIVE' && coinSymbol && isCoinSymbol(coinSymbol)) {
        return <CoinLogo symbol={coinSymbol} size={size} />;
    }

    if (asset?.symbol && 'address' in asset) {
        return (
            <AssetLogo
                symbol={network.symbol}
                contractAddress={asset.address}
                size={size}
                placeholder={asset.name ?? asset.symbol}
                // Temp. solution until we extend token defs with Vault tokens
                customLogoUrl={asset.logo_url}
            />
        );
    }

    return <IconCircle name="coins" size={iconCircleSize} intent="neutral" />;
}
