import {
    type EvmAssetDiff,
    type EvmAssetExposure,
    type SolanaAssetDiff,
    type SolanaMessageScanResponse,
    type StellarAssetDiff,
    type StellarTxScanResponse,
    type TransactionScanResponse,
    type TransactionSimulation,
} from '../types';

// Blockaid's generated types mark the account summary and the arrays inside it as required, but a
// scan whose simulation half degraded — an expired Solana blockhash on a refetch, say — answers
// with a success status and none of them. Each reader below returns `null` for "no usable
// simulation" and an array for "the simulation ran", so an empty array keeps meaning "no asset
// changes" and callers cannot confuse the two.

const sumUsd = (transfers: ReadonlyArray<{ usd_price?: string }>) =>
    transfers.reduce((total, transfer) => total + Number(transfer.usd_price ?? 0), 0);

// Outgoing assets first, then incoming, each by USD value descending.
const byEvmOutgoingFirst = (a: EvmAssetDiff, b: EvmAssetDiff) => {
    const isAOutgoing = a.out.length > 0;
    const isBOutgoing = b.out.length > 0;

    if (isAOutgoing !== isBOutgoing) {
        return isAOutgoing ? -1 : 1;
    }

    return isAOutgoing ? sumUsd(b.out) - sumUsd(a.out) : sumUsd(b.in) - sumUsd(a.in);
};

// Solana diffs hold a single in/out each, so outgoing-first is the whole ordering.
const bySolanaOutgoingFirst = (a: SolanaAssetDiff, b: SolanaAssetDiff) =>
    Number(Boolean(b.out)) - Number(Boolean(a.out));

export type EvmSimulationSummary = {
    simulation: TransactionSimulation;
    assetsDiffs: EvmAssetDiff[];
    exposures: EvmAssetExposure[];
};

/**
 * Account summary of a successful EVM simulation with its diffs in display order, or `null` when
 * the scan produced no usable simulation.
 */
export const getEvmSimulationSummary = (
    response: TransactionScanResponse,
): EvmSimulationSummary | null => {
    const { simulation } = response;

    if (simulation?.status !== 'Success' || !simulation.account_summary) {
        return null;
    }

    const { assets_diffs: assetsDiffs, exposures } = simulation.account_summary;

    return {
        simulation,
        // `assets_diffs` comes verbatim from an unsigned CDN (the cdn.trezor.io/dynamic/blockaid
        // proxy is NOT JWS-verified) and the `@blockaid/client` SDK does not runtime-validate the
        // response shape, so a malicious/MITM body could ship a truthy non-array. `.toSorted` would
        // then throw synchronously here; consumers such as getSimulatedReceiveAmount run in a render
        // body with no ErrorBoundary, so coerce a non-array to an empty list at this boundary.
        assetsDiffs: (Array.isArray(assetsDiffs) ? assetsDiffs : []).toSorted(byEvmOutgoingFirst),
        exposures: exposures ?? [],
    };
};

/**
 * Asset diffs of the scanned Solana account in display order, or `null` when the scan produced no
 * usable simulation.
 */
export const getSolanaAssetDiffs = (
    response: SolanaMessageScanResponse,
): SolanaAssetDiff[] | null => {
    const accountSummary = response.result?.simulation?.account_summary;

    if (!accountSummary) {
        return null;
    }

    return (accountSummary.account_assets_diff ?? []).toSorted(bySolanaOutgoingFirst);
};

/**
 * Asset diffs of the scanned Stellar account, or `null` when the scan produced no usable
 * simulation.
 */
export const getStellarAssetDiffs = (
    response: StellarTxScanResponse,
): StellarAssetDiff[] | null => {
    const { simulation } = response;

    if (simulation?.status !== 'Success' || !simulation.account_summary) {
        return null;
    }

    return simulation.account_summary.account_assets_diffs ?? [];
};
