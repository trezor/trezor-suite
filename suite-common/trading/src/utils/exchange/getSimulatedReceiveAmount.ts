import { type CryptoId } from 'invity-api';

import {
    type AccountSummary,
    type NetworkTxSimulationResult,
    getAssetDiffTransferAmount,
} from '@suite-common/tx-simulation';
import { BigNumber } from '@trezor/utils';

import { parseCryptoId } from '../../utils';

type EvmAssetDiff = AccountSummary['assets_diffs'][number];
type ReceiveAssetDiff = Extract<EvmAssetDiff, { asset_type: 'ERC20' | 'NATIVE' }>;

const isReceiveAssetDiff = (
    assetDiff: EvmAssetDiff,
    contractAddress: string | undefined,
): assetDiff is ReceiveAssetDiff => {
    if (contractAddress) {
        return (
            assetDiff.asset_type === 'ERC20' &&
            'address' in assetDiff.asset &&
            assetDiff.asset.address.toLowerCase() === contractAddress.toLowerCase()
        );
    }

    return assetDiff.asset_type === 'NATIVE';
};

/**
 * Extract how much of the quote's receive asset the user gets according to
 * a successful Blockaid simulation. Returns a decimal string in main units,
 * or `null` when the amount cannot be determined — callers are expected to
 * fall back to the quote data.
 */
export const getSimulatedReceiveAmount = (
    result: NetworkTxSimulationResult | undefined,
    quoteReceiveCryptoId: CryptoId | undefined,
): string | null => {
    const simulation = result?.payload.simulation;

    if (!quoteReceiveCryptoId || simulation?.status !== 'Success') {
        return null;
    }

    const { contractAddress } = parseCryptoId(quoteReceiveCryptoId);
    const assetDiff = simulation.account_summary.assets_diffs.find(
        (diff): diff is ReceiveAssetDiff => isReceiveAssetDiff(diff, contractAddress),
    );

    if (!assetDiff || assetDiff.in.length === 0) {
        return null;
    }

    const decimals = 'decimals' in assetDiff.asset ? assetDiff.asset.decimals : undefined;
    let total = new BigNumber(0);

    for (const transfer of assetDiff.in) {
        const amount = getAssetDiffTransferAmount(transfer, decimals);

        // Do not display a partial amount when any incoming transfer cannot be valued.
        if (amount === null || amount.isNaN()) {
            return null;
        }

        total = total.plus(amount);
    }

    return total.isGreaterThan(0) ? total.toString() : null;
};
