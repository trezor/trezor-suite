import { AssetIcon } from '@suite/assets';
import { toTokenAddress } from '@suite-common/tokens';
import { type SolanaAssetDiff } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { type TokenIconSize } from '@trezor/product-components';

interface SolanaTxSimulationAssetLogoProps {
    asset: SolanaAssetDiff['asset'];
    network: Network;
    size?: TokenIconSize;
}

export function SolanaTxSimulationAssetLogo({
    asset,
    network,
    size = 32,
}: SolanaTxSimulationAssetLogoProps) {
    // Only the native asset comes without a mint address.
    if (!('address' in asset)) {
        return <AssetIcon networkSymbol={network.symbol} size={size} />;
    }

    return (
        <AssetIcon
            networkSymbol={network.symbol}
            contractAddress={toTokenAddress(asset.address)}
            size={size}
            customLogoUrl={asset.logo ?? undefined}
        />
    );
}
