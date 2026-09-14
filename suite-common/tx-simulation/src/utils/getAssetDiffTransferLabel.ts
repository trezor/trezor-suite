import { type NetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';

import { getAssetDiffTransferAmount } from './getAssetDiffTransferAmount';
import { type SolanaAssetDiff, type StellarAssetDiff } from '../types';

type SolanaTransfer = NonNullable<SolanaAssetDiff['in'] | SolanaAssetDiff['out']>;
type StellarTransfer = NonNullable<StellarAssetDiff['in'] | StellarAssetDiff['out']>;

const composeLabel = (
    networkConfigDeps: NetworkConfigDeps,
    transfer: { raw_value: string | number; value?: string | number | null },
    decimals: number | undefined,
    code: string,
) => {
    const amount = getAssetDiffTransferAmount(networkConfigDeps, transfer, decimals);

    return amount === null ? code : `${amount.toString()} ${code}`;
};

/**
 * Amount of a Solana asset-diff transfer, e.g. `37.191885 fone`.
 *
 * Blockaid's own `summary` is unusable here: unlike EVM ("Sending 0.01 ETH") the Solana endpoint
 * phrases it in USD ("Lost approximately 0.42$"), which repeats the fiat column and hides the
 * amount the user gets.
 */
export const getSolanaAssetDiffLabel = (
    networkConfigDeps: NetworkConfigDeps,
    { asset }: SolanaAssetDiff,
    transfer: SolanaTransfer,
    symbol: NetworkSymbol,
) =>
    composeLabel(
        networkConfigDeps,
        transfer,
        'decimals' in asset ? asset.decimals : undefined,
        ('symbol' in asset && asset.symbol) || getNetworkDisplaySymbol(networkConfigDeps, symbol),
    );

/**
 * Same for Stellar. Blockaid rounds its main-unit `value` for display — a BTC-sized amount even
 * arrives as `0` — so the amount always comes from the exact `raw_value`, a stroop count like
 * everywhere else in Suite (`getStellarInactiveTokens`).
 */
export const getStellarAssetDiffLabel = (
    networkConfigDeps: NetworkConfigDeps,
    { asset }: StellarAssetDiff,
    transfer: StellarTransfer,
    symbol: NetworkSymbol,
) =>
    composeLabel(
        networkConfigDeps,
        transfer,
        STELLAR_DECIMALS,
        ('symbol' in asset ? asset.symbol : asset.code) ||
            getNetworkDisplaySymbol(networkConfigDeps, symbol),
    );
