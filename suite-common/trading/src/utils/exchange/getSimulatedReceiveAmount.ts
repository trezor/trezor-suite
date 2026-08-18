import { type CryptoId } from 'invity-api';

import {
    type AccountSummary,
    type CrossChainAssetDiff,
    type NetworkTxSimulationResult,
    type TransactionSimulation,
    getAssetDiffTransferAmount,
    getCrossChainAssetDiffs,
} from '@suite-common/tx-simulation';
import { BigNumber } from '@trezor/utils';

import { isCrossChainTrade, parseCryptoId } from '../../utils';

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

const findCrossChainReceiveDiff = (
    simulation: TransactionSimulation,
    accountAddress: string | undefined,
    contractAddress: string | undefined,
) =>
    getCrossChainAssetDiffs(simulation, accountAddress).find(diff =>
        contractAddress
            ? 'address' in diff.asset &&
              diff.asset.address.toLowerCase() === contractAddress.toLowerCase()
            : !('address' in diff.asset),
    );

/**
 * Extract how much of the quote's receive asset the user gets according to
 * a successful Blockaid simulation. Returns a decimal string in main units,
 * or `null` when the amount cannot be determined — callers are expected to
 * fall back to the quote data.
 */
export const getSimulatedReceiveAmount = (
    result: NetworkTxSimulationResult | undefined,
    quoteSendCryptoId: CryptoId | undefined,
    quoteReceiveCryptoId: CryptoId | undefined,
): string | null => {
    const simulation = result?.payload.simulation;

    if (!result || !quoteReceiveCryptoId || simulation?.status !== 'Success') {
        return null;
    }

    const { contractAddress } = parseCryptoId(quoteReceiveCryptoId);

    // Matching a bridged receive against the source chain picks that chain's native asset.
    const receiveDiff: ReceiveAssetDiff | CrossChainAssetDiff | undefined = isCrossChainTrade(
        quoteSendCryptoId,
        quoteReceiveCryptoId,
    )
        ? findCrossChainReceiveDiff(simulation, result.payload.account_address, contractAddress)
        : simulation.account_summary.assets_diffs.find((diff): diff is ReceiveAssetDiff =>
              isReceiveAssetDiff(diff, contractAddress),
          );

    if (!receiveDiff || receiveDiff.in.length === 0) {
        return null;
    }

    const decimals = 'decimals' in receiveDiff.asset ? receiveDiff.asset.decimals : undefined;
    let total = new BigNumber(0);

    for (const transfer of receiveDiff.in) {
        const amount = getAssetDiffTransferAmount(transfer, decimals);

        // Do not display a partial amount when any incoming transfer cannot be valued.
        if (amount === null || amount.isNaN()) {
            return null;
        }

        total = total.plus(amount);
    }

    return total.isGreaterThan(0) ? total.toString() : null;
};
