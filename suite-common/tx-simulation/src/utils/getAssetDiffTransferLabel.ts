import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';

import { getAssetDiffTransferAmount } from './getAssetDiffTransferAmount';
import { type SolanaAssetDiff, type StellarAssetDiff } from '../types';

type SolanaTransfer = NonNullable<SolanaAssetDiff['in'] | SolanaAssetDiff['out']>;
type StellarTransfer = NonNullable<StellarAssetDiff['in'] | StellarAssetDiff['out']>;

export type AssetDiffTransferLabel = {
    amount: string | null;
    /** `null` for an asset without a symbol of its own, labeled with its network's coin symbol. */
    assetSymbol: string | null;
};

const composeLabel = (
    transfer: { raw_value: string | number; value?: string | number | null },
    decimals: number | undefined,
    assetSymbol: string | null | undefined,
): AssetDiffTransferLabel => ({
    amount: getAssetDiffTransferAmount(transfer, decimals)?.toString() ?? null,
    assetSymbol: assetSymbol || null,
});

/**
 * Amount of a Solana asset-diff transfer, e.g. `37.191885 fone`.
 *
 * Blockaid's own `summary` is unusable here: unlike EVM ("Sending 0.01 ETH") the Solana endpoint
 * phrases it in USD ("Lost approximately 0.42$"), which repeats the fiat column and hides the
 * amount the user gets.
 */
export const getSolanaAssetDiffLabel = ({ asset }: SolanaAssetDiff, transfer: SolanaTransfer) =>
    composeLabel(
        transfer,
        'decimals' in asset ? asset.decimals : undefined,
        'symbol' in asset ? asset.symbol : undefined,
    );

/**
 * Same for Stellar. Blockaid rounds its main-unit `value` for display — a BTC-sized amount even
 * arrives as `0` — so the amount always comes from the exact `raw_value`, a stroop count like
 * everywhere else in Suite (`getStellarInactiveTokens`).
 */
export const getStellarAssetDiffLabel = ({ asset }: StellarAssetDiff, transfer: StellarTransfer) =>
    composeLabel(transfer, STELLAR_DECIMALS, 'symbol' in asset ? asset.symbol : asset.code);
