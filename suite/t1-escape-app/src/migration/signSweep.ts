import { transformReferencedTransactions } from '@trezor/connect-core/src/api/bitcoin/refTx';
import { signTx } from '@trezor/connect-core/src/api/bitcoin/signtx';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, ok } from '@trezor/type-utils';

import { loadAccountSnapshot } from './accountSnapshot';
import { type AmbiguityReason, evaluateAccountState } from './accountState';
import type { SignedSweepRecord, SweepLedger } from './sweepLedger';
import { diagnosticLog } from '../app/diagnosticLog';
import type { Backend, BackendError } from '../backend/backend';
import { BITCOIN_COIN_INFO } from '../bitcoin/bitcoinNetwork';
import type { SweepPlan } from '../bitcoin/composeSweep';
import { getOutpointKey } from '../bitcoin/outpoint';
import {
    type PreviousTransactionError,
    verifyPreviousTransactions,
} from '../bitcoin/verifyPreviousTransactions';
import { type SignedSweepError, verifySignedSweep } from '../bitcoin/verifySignedSweep';
import {
    type AccountPublicKeyError,
    type DiscoveredAccount,
    getAccountPublicKey,
} from '../device/accountPublicKey';
import { DeviceCallFailure, type DeviceSession } from '../device/deviceSession';

export type SignSweepError =
    /** The parts of the plan contradict each other. It did not come from the composer as is. */
    | { type: 'plan-inconsistent' }
    /** This exact transaction was already sent to the device once. It must be recomposed. */
    | { type: 'plan-already-attempted' }
    /** A signed transaction for these inputs exists. It can only be broadcast again. */
    | { type: 'inputs-already-signed' }
    | { type: 'ambiguous-state'; reasons: AmbiguityReason[] }
    /** An input is no longer an unspent confirmed output with the composed amount. */
    | { type: 'inputs-changed' }
    | { type: 'previous-transaction-invalid'; error: PreviousTransactionError }
    /** The device now holds a different wallet than the one that was scanned. */
    | { type: 'account-key-mismatch' }
    | { type: 'signing-failed'; reason: string }
    | SignedSweepError
    | AccountPublicKeyError
    | BackendError;

export type SignSweepParams = {
    session: DeviceSession;
    backend: Backend;
    ledger: SweepLedger;
    account: DiscoveredAccount;
    plan: SweepPlan;
};

// What gets verified (the UTXOs and the declared amount) must be what gets signed (the device
// inputs and the device output). The composer guarantees it; this keeps it guaranteed.
const isPlanConsistent = ({ utxos, inputs, output, destination, amount }: SweepPlan) =>
    inputs.length > 0 &&
    inputs.length === utxos.length &&
    inputs.every((input, index) => {
        const utxo = utxos[index];

        return (
            utxo?.txid === input.prev_hash &&
            utxo.vout === input.prev_index &&
            utxo.amount === input.amount
        );
    }) &&
    output.address === destination.address &&
    output.amount === amount;

const fetchPreviousTransactions = async (backend: Backend, plan: SweepPlan) => {
    const hexes = new Map<string, string>();

    for (const input of plan.inputs) {
        const txid = input.prev_hash.toLowerCase();
        if (hexes.has(txid)) continue;

        const hex = await backend.getTransactionHex(txid);
        if (!hex.success) return hex;

        hexes.set(txid, hex.payload);
    }

    return ok(hexes);
};

/**
 * Signs one composed sweep on the device. Every check that protects the funds runs here, in
 * this order, and any failure stops before the device is asked to sign:
 *
 * 1. the device inputs and output of the plan are the very UTXOs and amount it declares;
 * 2. the plan was never sent to the device before and its inputs have no signed transaction;
 * 3. a fresh backend snapshot still lists every input as unspent, confirmed and unambiguous;
 * 4. every input is proven against its previous transaction (hash, script and amount);
 * 5. the device still derives the account key that was scanned.
 *
 * After signing, the returned transaction is checked to be exactly the composed one.
 */
export const signSweep = async ({
    session,
    backend,
    ledger,
    account,
    plan,
}: SignSweepParams): Promise<Result<SignedSweepRecord, SignSweepError>> => {
    const log = (message: string, details?: Record<string, unknown>) =>
        diagnosticLog.info('sign', message, {
            account: `${account.accountType} #${account.accountIndex}`,
            inputs: plan.inputs.length,
            ...details,
        });

    if (!isPlanConsistent(plan)) return err({ type: 'plan-inconsistent' });

    const outpoints = plan.utxos.map(getOutpointKey);
    if (outpoints.some(outpoint => ledger.isOutpointSigned(outpoint))) {
        return err({ type: 'inputs-already-signed' });
    }
    if (ledger.hasAttempted(plan)) return err({ type: 'plan-already-attempted' });
    log('ledger checks passed');

    const snapshot = await loadAccountSnapshot({ backend, account });
    if (!snapshot.success) return snapshot;

    const state = evaluateAccountState(snapshot.payload);
    if (state.ambiguities.length > 0) {
        return err({ type: 'ambiguous-state', reasons: state.ambiguities });
    }
    log('fresh account state loaded', {
        spendable: state.spendable.length,
        unconfirmed: state.unconfirmed.length,
        inFlight: state.inFlight.length,
    });

    const spendableAmounts = new Map(
        state.spendable.map(utxo => [getOutpointKey(utxo), utxo.amount]),
    );
    const areInputsUnchanged = plan.utxos.every(
        utxo => spendableAmounts.get(getOutpointKey(utxo)) === utxo.amount,
    );
    if (!areInputsUnchanged) return err({ type: 'inputs-changed' });
    log('inputs still unspent with the composed amounts');

    const previousTransactionHexes = await fetchPreviousTransactions(backend, plan);
    if (!previousTransactionHexes.success) return previousTransactionHexes;
    log('previous transactions fetched', {
        transactions: previousTransactionHexes.payload.size,
    });

    const previousTransactions = verifyPreviousTransactions({
        inputs: plan.inputs,
        previousTransactionHexes: previousTransactionHexes.payload,
        accountType: account.accountType,
        accountPath: account.path,
        accountXpub: account.xpub,
    });
    if (!previousTransactions.success) {
        diagnosticLog.error(
            'sign',
            'previous transaction check failed',
            previousTransactions.error,
        );

        return err({ type: 'previous-transaction-invalid', error: previousTransactions.error });
    }
    log('previous transactions verified');

    // Asked last, right before signing: the passphrase cache of the device may have been
    // reset since discovery, and a different passphrase would silently select another wallet.
    const currentAccount = await getAccountPublicKey({
        call: session.call,
        accountType: account.accountType,
        accountIndex: account.accountIndex,
    });
    if (!currentAccount.success) return currentAccount;
    if (currentAccount.payload.xpub !== account.xpub) {
        diagnosticLog.error('sign', 'the device derives a different account key than scanned');

        return err({ type: 'account-key-mismatch' });
    }
    log('account key confirmed by the device');

    // The user may confirm the output on the device even if signing fails afterwards, so the
    // plan is spent the moment it is sent. A retry needs a new plan with a new amount.
    ledger.markAttempted(plan);
    log('SignTx started', { outputScriptType: plan.output.script_type });
    const signingStartedAt = Date.now();

    let serializedTx: string;
    try {
        const signed = await signTx({
            typedCall: session.typedCall,
            inputs: plan.inputs,
            // The shared schema types an external output as PAYTOADDRESS only, while firmware
            // older than 1.5.0 needs PAYTOSCRIPTHASH to pay a P2SH destination.
            outputs: [plan.output as PROTO.TxOutputType],
            refTxs: transformReferencedTransactions(previousTransactions.payload),
            // Without options the helper asks for transaction version 1 and leaves the lock
            // time at the firmware default of zero, which the check after signing relies on.
            options: {},
            coinInfo: BITCOIN_COIN_INFO,
        });
        ({ serializedTx } = signed);
        log('SignTx finished', {
            durationMs: Date.now() - signingStartedAt,
            bytes: serializedTx.length / 2,
        });
    } catch (error) {
        const callError = error instanceof DeviceCallFailure ? error.callError : undefined;
        diagnosticLog.error('sign', 'SignTx failed', {
            durationMs: Date.now() - signingStartedAt,
            ...(callError ?? { message: error instanceof Error ? error.message : String(error) }),
        });

        if (callError?.type !== 'device-lost') {
            // Leaves no half-finished signing behind on the device. The outcome is irrelevant.
            await session.call('Initialize', 'Features');
        }

        return err(
            callError ?? {
                type: 'signing-failed',
                reason: error instanceof Error ? error.message : 'Unknown signing error',
            },
        );
    }

    const signedSweep = verifySignedSweep({ serializedTx, plan });
    if (!signedSweep.success) {
        diagnosticLog.error('sign', 'signed transaction differs from the plan', {
            reason: signedSweep.error.reason,
        });

        return signedSweep;
    }
    log('signed transaction verified');

    const record: SignedSweepRecord = { ...signedSweep.payload, account, plan, outpoints };
    ledger.recordSigned(record);

    return ok(record);
};
