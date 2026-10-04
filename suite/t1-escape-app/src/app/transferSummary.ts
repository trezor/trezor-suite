import { type Transfer, isTransferUnsettled } from './migrationState';
import type { LeftoverReason } from '../bitcoin/composeSweep';

/**
 * Coins left behind for a reason the user did not choose: an unconfirmed output confirms and an
 * immature coinbase matures, and from then on only the old device can spend them.
 */
const INVOLUNTARY_LEFTOVER_REASONS: readonly LeftoverReason[] = [
    'unconfirmed',
    'immature-coinbase',
];

export type TransferSummary = {
    /** Transfers handed to the network. */
    sent: Transfer[];
    /** Accounts with coins that were found but not sent, including ones that failed to prepare. */
    notSent: Transfer[];
    /** Amounts of the coins deliberately left behind: too small, unconfirmed or immature. */
    leftoverAmounts: string[];
    hasPending: boolean;
    /** True only when every transfer that was needed has been sent and is confirmed. */
    isEverythingConfirmed: boolean;
};

/**
 * What the last screen may claim. It must never say that the found funds were transferred
 * while coins of a scanned account are still on the old device for a reason the user did not
 * choose.
 */
export const summarizeTransfers = (transfers: readonly Transfer[]): TransferSummary => {
    const sent = transfers.filter(({ stage }) => stage === 'broadcast');
    // A transfer without a plan counts only when preparing it failed. Without an error the
    // account simply holds nothing that can be moved.
    const notSent = transfers.filter(
        ({ stage, plan, error }) =>
            stage !== 'broadcast' && (plan !== undefined || error !== undefined),
    );
    const leftoverAmounts = transfers.flatMap(({ leftovers }) =>
        leftovers.map(({ utxo }) => utxo.amount),
    );
    const hasPending = transfers.some(isTransferUnsettled);
    const hasInvoluntaryLeftovers = transfers.some(({ leftovers }) =>
        leftovers.some(({ reason }) => INVOLUNTARY_LEFTOVER_REASONS.includes(reason)),
    );

    return {
        sent,
        notSent,
        leftoverAmounts,
        hasPending,
        isEverythingConfirmed:
            sent.length > 0 &&
            sent.every(({ status }) => status === 'confirmed') &&
            notSent.length === 0 &&
            !hasPending &&
            !hasInvoluntaryLeftovers,
    };
};
