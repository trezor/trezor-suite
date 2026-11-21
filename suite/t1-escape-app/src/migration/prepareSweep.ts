import { type Result, err, ok } from '@trezor/type-utils';

import { type AccountSnapshot, loadAccountSnapshot } from './accountSnapshot';
import { type AccountState, type AmbiguityReason, evaluateAccountState } from './accountState';
import type { SweepLedger } from './sweepLedger';
import type { Backend, BackendError } from '../backend/backend';
import {
    type ComposeSweepError,
    type Leftover,
    type SweepPlan,
    composeSweep,
    planSweepBatches,
} from '../bitcoin/composeSweep';
import type { Destination } from '../bitcoin/destinationAddress';
import { getOutpointKey } from '../bitcoin/outpoint';
import type { DiscoveredAccount } from '../device/accountPublicKey';
import type { FirmwareVersion } from '../firmware/firmwareSupport';

export type PreparedSweep = {
    /** Next transaction to sign for the account, or undefined when nothing can be moved. */
    plan?: SweepPlan;
    /** Transactions that will follow once this one is on its way. */
    followingTransactions: number;
    leftovers: Leftover[];
    state: AccountState;
    snapshot: AccountSnapshot;
};

export type PrepareSweepError =
    | BackendError
    | ComposeSweepError
    /** The backend data contradicts itself. Nothing is composed until it clears up. */
    | { type: 'ambiguous-state'; reasons: AmbiguityReason[] };

export type PrepareSweepParams = {
    backend: Backend;
    ledger: SweepLedger;
    account: DiscoveredAccount;
    destination: Destination;
    firmwareVersion: FirmwareVersion;
    getRandomInt: (min: number, max: number) => number;
};

/**
 * Composes the next sweep of an account from a fresh backend snapshot, so that no input already
 * spent in the mempool and no input already covered by a signed transaction is selected again.
 */
export const prepareSweep = async ({
    backend,
    ledger,
    account,
    destination,
    firmwareVersion,
    getRandomInt,
}: PrepareSweepParams): Promise<Result<PreparedSweep, PrepareSweepError>> => {
    const snapshot = await loadAccountSnapshot({ backend, account });
    if (!snapshot.success) return snapshot;

    const state = evaluateAccountState(snapshot.payload);
    if (state.ambiguities.length > 0) {
        return err({ type: 'ambiguous-state', reasons: state.ambiguities });
    }

    const unsignedUtxos = state.spendable.filter(
        utxo => !ledger.isOutpointSigned(getOutpointKey(utxo)),
    );
    const { batches, leftovers: uneconomic } = planSweepBatches({
        utxos: unsignedUtxos,
        accountType: account.accountType,
    });
    const leftovers: Leftover[] = [
        ...uneconomic,
        ...state.unconfirmed.map(utxo => ({ utxo, reason: 'unconfirmed' as const })),
    ];
    const prepared = { leftovers, state, snapshot: snapshot.payload };

    const [nextBatch, ...followingBatches] = batches;
    if (!nextBatch) return ok({ ...prepared, followingTransactions: 0 });

    const plan = composeSweep({
        utxos: nextBatch,
        accountType: account.accountType,
        destination,
        firmwareVersion,
        usedAmounts: ledger.getUsedAmounts(),
        getRandomInt,
    });

    if (!plan.success) {
        if (plan.error.type !== 'insufficient-for-fee') return plan;

        // Batches are ordered by value, so when the most valuable one cannot pay for its own
        // transaction, none of the following ones can either.
        const unaffordable = batches
            .flat()
            .map(utxo => ({ utxo, reason: 'insufficient-for-fee' as const }));

        return ok({
            ...prepared,
            leftovers: [...leftovers, ...unaffordable],
            followingTransactions: 0,
        });
    }

    // From now on this amount counts as shown to the user, whether or not it gets signed.
    ledger.registerAmount(plan.payload.amount);

    return ok({
        ...prepared,
        plan: plan.payload,
        followingTransactions: followingBatches.length,
    });
};
