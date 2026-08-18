import { type SolanaAssetDiff } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { TokenIcon, type TokenIconSize } from '@trezor/product-components';

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
        return <TokenIcon symbol={network.symbol} size={size} />;
    }

    return (
        <TokenIcon
            symbol={network.symbol}
            contractAddress={asset.address}
            size={size}
            placeholder={asset.name || asset.symbol}
            customLogoUrl={asset.logo ?? undefined}
        />
    );
}
