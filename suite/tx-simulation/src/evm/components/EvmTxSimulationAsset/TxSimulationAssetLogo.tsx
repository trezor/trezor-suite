import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { IconCircle } from '@trezor/components';
import { CoinsIcon } from '@trezor/icons';
import { TokenIcon, type TokenIconSize, isCoinSymbol } from '@trezor/product-components';

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
    const coinSymbol = asset?.symbol?.toLowerCase();
    const iconCircleSize = size === 20 ? 24 : size;

    if (assetType === 'NATIVE' && coinSymbol && isCoinSymbol(coinSymbol)) {
        return <TokenIcon symbol={coinSymbol as NetworkSymbol} size={size} />;
    }

    if (asset?.symbol && 'address' in asset) {
        return (
            <TokenIcon
                symbol={network.symbol}
                contractAddress={asset.address}
                size={size}
                placeholder={asset.name ?? asset.symbol}
                // Temp. solution until we extend token defs with Vault tokens
                customLogoUrl={asset.logo_url}
            />
        );
    }

    return <IconCircle icon={CoinsIcon} size={iconCircleSize} intent="neutral" />;
}
