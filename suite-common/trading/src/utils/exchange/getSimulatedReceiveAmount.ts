import { type CryptoId } from 'invity-api';

import {
    type AccountSummary,
    type CrossChainAssetDiff,
    type NetworkTxSimulationResult,
    type SolanaAssetDiff,
    type StellarAssetDiff,
    type TransactionSimulation,
    getAssetDiffTransferAmount,
    getCrossChainAssetDiffs,
} from '@suite-common/tx-simulation';
import { BigNumber } from '@trezor/utils';

import { isCrossChainTrade, parseCryptoId } from '../../utils';

type EvmAssetDiff = AccountSummary['assets_diffs'][number];
type ReceiveAssetDiff = Extract<EvmAssetDiff, { asset_type: 'ERC20' | 'NATIVE' }>;

type ReceiveTransfers = {
    decimals: number | undefined;
    transfers: ReadonlyArray<{ raw_value: string | number; value?: string | number | null }>;
};

// EVM addresses differ only by checksum casing; base58 mints are case-sensitive.
const isSameAssetAddress = (address: string, contractAddress: string) =>
    address.startsWith('0x') && contractAddress.startsWith('0x')
        ? address.toLowerCase() === contractAddress.toLowerCase()
        : address === contractAddress;

const isReceiveAssetDiff = (
    assetDiff: EvmAssetDiff,
    contractAddress: string | undefined,
): assetDiff is ReceiveAssetDiff => {
    if (contractAddress) {
        return (
            assetDiff.asset_type === 'ERC20' &&
            'address' in assetDiff.asset &&
            isSameAssetAddress(assetDiff.asset.address, contractAddress)
        );
    }

    return assetDiff.asset_type === 'NATIVE';
};

// Solana asset_type is a plain string, so the asset shape is what tells a mint apart from SOL.
const isSolanaReceiveAssetDiff = (
    assetDiff: SolanaAssetDiff,
    contractAddress: string | undefined,
) =>
    contractAddress
        ? 'address' in assetDiff.asset &&
          isSameAssetAddress(assetDiff.asset.address, contractAddress)
        : !('address' in assetDiff.asset);

type ReceiveAsset =
    | ReceiveAssetDiff['asset']
    | CrossChainAssetDiff['asset']
    | SolanaAssetDiff['asset']
    | StellarAssetDiff['asset'];

const toReceiveTransfers = (
    asset: ReceiveAsset,
    transfers: ReceiveTransfers['transfers'],
): ReceiveTransfers => ({
    decimals: 'decimals' in asset ? asset.decimals : undefined,
    transfers,
});

const getEvmReceiveTransfers = (
    summary: AccountSummary,
    contractAddress: string | undefined,
): ReceiveTransfers | null => {
    const assetDiff = summary.assets_diffs.find((diff): diff is ReceiveAssetDiff =>
        isReceiveAssetDiff(diff, contractAddress),
    );

    return assetDiff ? toReceiveTransfers(assetDiff.asset, assetDiff.in) : null;
};

const getCrossChainReceiveTransfers = (
    simulation: TransactionSimulation,
    accountAddress: string | undefined,
    contractAddress: string | undefined,
): ReceiveTransfers | null => {
    const assetDiff = getCrossChainAssetDiffs(simulation, accountAddress).find(diff =>
        contractAddress
            ? 'address' in diff.asset && isSameAssetAddress(diff.asset.address, contractAddress)
            : !('address' in diff.asset),
    );

    return assetDiff ? toReceiveTransfers(assetDiff.asset, assetDiff.in) : null;
};

const getSolanaReceiveTransfers = (
    assetDiffs: ReadonlyArray<SolanaAssetDiff>,
    contractAddress: string | undefined,
): ReceiveTransfers | null => {
    const assetDiff = assetDiffs.find(diff => isSolanaReceiveAssetDiff(diff, contractAddress));

    // Solana reports at most one incoming transfer per asset.
    return assetDiff
        ? toReceiveTransfers(assetDiff.asset, assetDiff.in ? [assetDiff.in] : [])
        : null;
};

// Stellar reports a contract asset by address; a legacy asset only by code and issuer, which
// cannot be compared to the wallet's contract id without deriving it asynchronously.
const isStellarReceiveAssetDiff = (
    assetDiff: StellarAssetDiff,
    contractAddress: string | undefined,
) =>
    contractAddress
        ? 'address' in assetDiff.asset &&
          isSameAssetAddress(assetDiff.asset.address, contractAddress)
        : !('address' in assetDiff.asset) && !('issuer' in assetDiff.asset);

const getStellarReceiveTransfers = (
    assetDiffs: ReadonlyArray<StellarAssetDiff>,
    contractAddress: string | undefined,
): ReceiveTransfers | null => {
    const assetDiff = assetDiffs.find(diff => isStellarReceiveAssetDiff(diff, contractAddress));

    // Stellar reports at most one incoming transfer per asset.
    return assetDiff
        ? toReceiveTransfers(assetDiff.asset, assetDiff.in ? [assetDiff.in] : [])
        : null;
};

const getReceiveTransfers = (
    result: NetworkTxSimulationResult,
    isCrossChain: boolean,
    contractAddress: string | undefined,
): ReceiveTransfers | null => {
    switch (result.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const { simulation, account_address } = result.payload;

            if (simulation?.status !== 'Success') {
                return null;
            }

            // Matching a bridged receive against the source chain picks that chain's native asset.
            return isCrossChain
                ? getCrossChainReceiveTransfers(simulation, account_address, contractAddress)
                : getEvmReceiveTransfers(simulation.account_summary, contractAddress);
        }

        case 'solanaSignTransaction': {
            const assetDiffs =
                result.payload.result?.simulation?.account_summary.account_assets_diff;

            return assetDiffs ? getSolanaReceiveTransfers(assetDiffs, contractAddress) : null;
        }

        case 'stellarSignTransaction': {
            const { simulation } = result.payload;
            const assetDiffs =
                simulation?.status === 'Success'
                    ? simulation.account_summary.account_assets_diffs
                    : undefined;

            return assetDiffs ? getStellarReceiveTransfers(assetDiffs, contractAddress) : null;
        }

        default:
            return null;
    }
};

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
    if (!result || !quoteReceiveCryptoId) {
        return null;
    }

    const { contractAddress } = parseCryptoId(quoteReceiveCryptoId);
    const isCrossChain = isCrossChainTrade(quoteSendCryptoId, quoteReceiveCryptoId);
    const received = getReceiveTransfers(result, isCrossChain, contractAddress);

    if (!received || received.transfers.length === 0) {
        return null;
    }

    let total = new BigNumber(0);

    for (const transfer of received.transfers) {
        const amount = getAssetDiffTransferAmount(transfer, received.decimals);

        // Do not display a partial amount when any incoming transfer cannot be valued.
        if (amount === null || amount.isNaN()) {
            return null;
        }

        total = total.plus(amount);
    }

    return total.isGreaterThan(0) ? total.toString() : null;
};
