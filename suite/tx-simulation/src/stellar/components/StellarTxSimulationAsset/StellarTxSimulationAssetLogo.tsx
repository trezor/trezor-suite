import { type StellarAssetDiff } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { IconCircle } from '@trezor/components';
import { CoinsIcon } from '@trezor/icons';
import { TokenIcon, type TokenIconSize } from '@trezor/product-components';

interface StellarTxSimulationAssetLogoProps {
    asset: StellarAssetDiff['asset'];
    network: Network;
    size?: TokenIconSize;
}

export function StellarTxSimulationAssetLogo({
    asset,
    network,
    size = 32,
}: StellarTxSimulationAssetLogoProps) {
    if ('address' in asset) {
        return (
            <TokenIcon
                symbol={network.symbol}
                contractAddress={asset.address}
                size={size}
                placeholder={asset.name || asset.symbol}
            />
        );
    }

    // Classic assets are identified by code plus issuer, which token definitions do not cover.
    if ('issuer' in asset) {
        return <IconCircle icon={CoinsIcon} size={size === 20 ? 24 : size} intent="neutral" />;
    }

    return <TokenIcon symbol={network.symbol} size={size} />;
}
