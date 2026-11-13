import { AssetIcon } from '@suite/assets';
import { toTokenAddress } from '@suite-common/tokens';
import { type StellarAssetDiff } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { IconCircle } from '@trezor/components';
import { CoinsIcon } from '@trezor/icons';
import { type TokenIconSize } from '@trezor/product-components';

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
            <AssetIcon
                networkSymbol={network.symbol}
                contractAddress={toTokenAddress(asset.address)}
                size={size}
            />
        );
    }

    // Classic assets are identified by code plus issuer, which token definitions do not cover.
    if ('issuer' in asset) {
        return <IconCircle icon={CoinsIcon} size={size === 20 ? 24 : size} intent="neutral" />;
    }

    return <AssetIcon networkSymbol={network.symbol} size={size} />;
}
