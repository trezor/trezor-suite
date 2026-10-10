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
    /** Transfers the page saw on the network. */
    sent: Transfer[];
    /**
     * Accounts with coins that were found but not seen moving: not signed, signed but not seen on
     * the network, or failed to prepare.
     */
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
    const sent = transfers.filter(({ stage }) => stage === 'on-network');
    // A transfer without a plan counts only when preparing it failed. Without an error the
    // account simply holds nothing that can be moved.
    const notSent = transfers.filter(
        ({ stage, plan, error }) =>
            stage !== 'on-network' && (plan !== undefined || error !== undefined),
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

export type MigrationOutcome =
    /** Every coin that had something to move has all of it sent and confirmed. */
    | 'confirmed'
    /** Some transfer is still being followed on the network. */
    | 'pending'
    /** Something that was found is still on the old device, or nothing could be moved. */
    | 'incomplete';

type CoinOutcome = Pick<TransferSummary, 'hasPending' | 'isEverythingConfirmed'>;

/**
 * What the headline of the last screen may claim, judged over the coins that had something
 * to move. One coin left unsent or pending keeps the whole page from claiming success.
 */
export const getMigrationOutcome = (coins: readonly CoinOutcome[]): MigrationOutcome => {
    if (coins.some(({ hasPending }) => hasPending)) return 'pending';

    const isEveryCoinConfirmed =
        coins.length > 0 && coins.every(({ isEverythingConfirmed }) => isEverythingConfirmed);

    return isEveryCoinConfirmed ? 'confirmed' : 'incomplete';
};
