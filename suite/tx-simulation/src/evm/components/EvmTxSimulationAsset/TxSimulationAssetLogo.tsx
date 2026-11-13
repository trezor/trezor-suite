import { AssetIcon } from '@suite/assets';
import { injectHasNetworkIcon } from '@suite-common/networks';
import { toTokenAddress } from '@suite-common/tokens';
import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { IconCircle } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CoinsIcon } from '@trezor/icons';
import { TokenIcon, type TokenIconSize } from '@trezor/product-components';

interface TxSimulationAssetLogoProps {
    asset?: EvmAssetDiff['asset'] | EvmAssetExposure['asset'];
    assetType?: EvmAssetDiff['asset_type'] | EvmAssetExposure['asset_type'];
    network: Network;
    size?: TokenIconSize;
}

export function TxSimulationAssetLogo({
    asset,
    assetType,
    network,
    size = 32,
}: TxSimulationAssetLogoProps) {
    const { hasNetworkIcon } = useServices(injectHasNetworkIcon);
    const iconCircleSize = size === 20 ? 24 : size;

    if (assetType === 'NATIVE' && asset?.symbol && hasNetworkIcon(asset.symbol)) {
        return <TokenIcon networkSymbol={asset.symbol} size={size} />;
    }

    if (asset?.symbol && 'address' in asset) {
        return (
            <AssetIcon
                networkSymbol={network.symbol}
                contractAddress={toTokenAddress(asset.address)}
                size={size}
                // Temp. solution until we extend token defs with Vault tokens
                customLogoUrl={asset.logo_url}
            />
        );
    }

    return <IconCircle icon={CoinsIcon} size={iconCircleSize} intent="neutral" />;
}
