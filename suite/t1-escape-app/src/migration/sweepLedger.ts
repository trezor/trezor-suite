import type { SweepPlan } from '../bitcoin/composeSweep';
import { getOutpointKey } from '../bitcoin/outpoint';
import type { SignedSweep } from '../bitcoin/verifySignedSweep';
import type { DiscoveredAccount } from '../device/accountPublicKey';

export type SignedSweepRecord = SignedSweep & {
    account: DiscoveredAccount;
    plan: SweepPlan;
    /** Outpoints the transaction spends. Its progress is tracked by these, not by its id. */
    outpoints: string[];
};

/**
 * Memory of what this page session already composed and signed. It exists to keep the app
 * itself from ever asking the user to confirm the same address with the same amount twice,
 * and from signing a second transaction over inputs that already have a signed one.
 * It is deliberately not persisted: after a reload the state is rebuilt from the backend.
 */
export type SweepLedger = {
    getUsedAmounts: () => ReadonlySet<string>;
    registerAmount: (amount: string) => void;
    /** Tells whether the plan was already sent to the device once. */
    hasAttempted: (plan: SweepPlan) => boolean;
    markAttempted: (plan: SweepPlan) => void;
    recordSigned: (record: SignedSweepRecord) => void;
    getSignedSweeps: () => readonly SignedSweepRecord[];
    isOutpointSigned: (outpoint: string) => boolean;
};

/** Identity of a transaction skeleton: its ordered inputs, its destination and its amount. */
export const getSkeletonId = (plan: SweepPlan) =>
    [...plan.utxos.map(getOutpointKey), plan.destination.script.toString('hex'), plan.amount].join(
        '|',
    );

export const createSweepLedger = (): SweepLedger => {
    const usedAmounts = new Set<string>();
    const attemptedSkeletons = new Set<string>();
    const signedSweeps: SignedSweepRecord[] = [];
    const signedOutpoints = new Set<string>();

    return {
        getUsedAmounts: () => usedAmounts,
        registerAmount: amount => {
            usedAmounts.add(amount);
        },
        hasAttempted: plan => attemptedSkeletons.has(getSkeletonId(plan)),
        markAttempted: plan => {
            attemptedSkeletons.add(getSkeletonId(plan));
        },
        recordSigned: record => {
            signedSweeps.push(record);
            record.outpoints.forEach(outpoint => signedOutpoints.add(outpoint));
        },
        getSignedSweeps: () => signedSweeps,
        isOutpointSigned: outpoint => signedOutpoints.has(outpoint),
    };
};
