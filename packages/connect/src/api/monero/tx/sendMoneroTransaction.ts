// Top-level driver for sending Monero: turn the wallet's spendable outputs + destinations into a
// validated, relayed transaction. It sequences the (individually unit-tested) building blocks and
// takes the device (key-image sync + signing) and daemon as injected dependencies, so the
// orchestration itself is testable with stubs. The device round-trips are validated on real
// hardware — that crypto cannot be exercised headlessly.
//
//   gather spendable inputs (resolve on-chain metadata)
//     -> select inputs to cover the send (fee grows with input count)
//     -> build decoy rings (daemon get_outs) + sync key images (device)
//     -> compose + sign on the device + assemble (signMoneroTransaction)
//     -> validate against consensus (do_not_relay) and only then broadcast
import { type DecoySelector, buildOwnedInputs } from './buildInputs';
import type { MoneroDaemonRpc, SendRawTransactionResult } from './daemonRpc';
import type { DecryptedKeyImage } from './decryptKeyImages';
import { estimateMoneroFee } from './estimateFee';
import { type SpendableInput, type WalletOutput, gatherSpendableInputs } from './gatherInputs';
import { bytesToHex } from './hex';
import { selectInputs } from './selectInputs';
import { type MoneroDeviceSigner, signMoneroTransaction } from './signTransaction';

const DEFAULT_RING_SIZE = 16;

// monerod often returns an empty `reason` for a do_not_relay validation failure and signals the cause
// only through boolean flags. Surface those so a rejection says *why* (fee too low / bad input / …)
// instead of a bare "Failed".
const describeRejection = (result: SendRawTransactionResult): string => {
    const flags = [
        result.feeTooLow && 'fee too low',
        result.overspend && 'overspend (inputs do not cover outputs + fee)',
        result.invalidInput && 'invalid input (ring members / key image)',
        result.invalidOutput && 'invalid output (commitment / range proof)',
        result.lowMixin && 'low mixin (ring size)',
        result.doubleSpend && 'double spend',
        result.tooBig && 'too big',
        result.notRelayed && 'not relayed',
    ].filter((flag): flag is string => Boolean(flag));

    return [result.reason, ...flags].filter(Boolean).join('; ') || result.status || 'unknown';
};

// Upper-bound estimate of tx_extra so the fee is never under-set: tx public key (33) + a payment-id
// nonce allowance (~11) + one additional public key per output for subaddress sends (33 each).
// Over-estimating only over-pays the fee slightly; under-estimating risks a below-min-fee rejection.
const extraSizeEstimate = (numOutputs: number) => 44 + 33 * numOutputs;

/** Per-input data the device needs to export a key image (MoneroTransferDetails). */
export interface KeyImageInput {
    /** The output's one-time public key (out_key), hex. */
    outKey: string;
    /** Public key of the transaction that created the output, hex. */
    txPubKey: string;
    additionalTxPubKeys: string[];
    /** Index of the output within its source transaction. */
    internalOutputIndex: number;
    subAddrMajor: number;
    subAddrMinor: number;
}

/**
 * Exports one key image (+ spend signature) per input (device moneroKeyImageSync), in the same order
 * as `inputs`. The send uses only the key image; the signature rides along so the after-send import
 * can reuse this single device export.
 */
export type KeyImageProvider = (inputs: KeyImageInput[]) => Promise<DecryptedKeyImage[]>;

export interface MoneroSendParams {
    /** The wallet's spendable outputs (blockchain-link misc.moneroOutputs). */
    walletOutputs: WalletOutput[];
    /** Wallet private view key (32-byte hex), used to derive each input's commitment mask. */
    viewKey: string;
    destinations: { address: string; amount: number }[];
    /** The wallet's own primary address, where change is sent. */
    changeAddress: string;
    account?: number;
    ringSize?: number;
    /** Per-byte base fee + quantization mask (daemon get_fee_estimate, priority already applied). */
    fee: { baseFeePerByte: number; quantizationMask: number };
    /**
     * Sweep the whole balance to the single destination: spend every output and send (total - fee),
     * with no change. The destination's amount is ignored (recomputed here).
     */
    isMax?: boolean;
    /**
     * Build + sign the transaction but do not submit it to the daemon at all. Used by the send form's
     * sign step; a separate push step performs the single broadcast (which also consensus-validates),
     * so signing and relaying stay distinct and the same tx is never submitted to monerod twice.
     */
    doNotRelay?: boolean;
    daemon: Pick<
        MoneroDaemonRpc,
        'getTransactions' | 'getOuts' | 'sendRawTransaction' | 'isKeyImageSpent'
    >;
    selectDecoys: DecoySelector;
    getKeyImages: KeyImageProvider;
    signer: MoneroDeviceSigner;
    /**
     * DEBUG: invoked with the assembled, signed transaction hex (and the device's own tx prefix hash)
     * when monerod rejects it on broadcast. Lets the host persist the failing transaction locally for
     * offline inspection. Temporary diagnostic for the live send bring-up; remove once green.
     */
    onValidationFailure?: (txHex: string, txPrefixHash?: string) => void;
}

/** Map a resolved spendable input to the transfer detail the device needs to export its key image. */
export const toKeyImageInput =
    (account: number) =>
    (input: SpendableInput): KeyImageInput => ({
        outKey: input.stealthPublicKey,
        txPubKey: input.realOutTxKey,
        additionalTxPubKeys: input.realOutAdditionalTxKeys ?? [],
        internalOutputIndex: input.realOutputInTxIndex,
        subAddrMajor: account,
        subAddrMinor: input.subaddrMinor,
    });

export interface MoneroSendResult {
    /** The serialized, relayed transaction, hex. */
    txHex: string;
    fee: number;
    change: number;
    /** Whether monerod accepted the broadcast. */
    relayed: boolean;
    /**
     * Key image (+ spend signature) for every owned output, in the wallet's transfer order — the
     * exact input wallet2's import_key_images expects (positional, offset 0). Returned so the
     * after-send sync can import these directly, with no second device key-image export.
     */
    keyImages: DecryptedKeyImage[];
}

export const sendMoneroTransaction = async (
    params: MoneroSendParams,
): Promise<MoneroSendResult> => {
    const account = params.account ?? 0;
    const ringSize = params.ringSize ?? DEFAULT_RING_SIZE;

    if (params.destinations.length === 0) {
        throw new Error('sendMoneroTransaction: at least one destination is required');
    }

    const sendTotal = params.destinations.reduce((sum, dest) => sum + dest.amount, 0);

    // Resolve every spendable output's on-chain metadata (in-tx index + tx public key) and derive
    // its commitment mask from the view key.
    const gathered = await gatherSpendableInputs(
        params.walletOutputs,
        params.daemon,
        params.viewKey,
    );

    // Export a key image (+ spend signature) for EVERY owned output in one device round-trip. This
    // single export serves three purposes: (1) the per-input key images the transaction's vins need;
    // (2) the spent-output filter below — a view-only wallet cannot compute key images, so it cannot
    // tell which of its outputs were already spent (monerod would reject those as a double-spend);
    // (3) the full {keyImage, signature} set is returned so the after-send import (wallet2
    // import_key_images) can reuse it instead of doing a second key-image sync. Because the import is
    // positional over the wallet's full transfer set, `gathered` here must be ALL owned outputs, in
    // transfer order — the caller passes the unfiltered allOutputs set.
    const allKeyImages = await params.getKeyImages(gathered.map(toKeyImageInput(account)));
    const spentStatus = await params.daemon.isKeyImageSpent(
        allKeyImages.map(ki => bytesToHex(ki.keyImage)),
    );
    // Spendable = unlocked AND unfrozen AND unspent. spent_status: 0 = unspent, 1 = block, 2 = pool.
    const spendable = gathered
        .map((input, i) => ({ ...input, keyImage: allKeyImages[i]!.keyImage }))
        .filter((input, i) => !input.locked && !input.frozen && spentStatus[i] === 0);
    if (spendable.length === 0) {
        throw new Error(
            'sendMoneroTransaction: no spendable outputs — every owned output is already spent, locked, or frozen (the watch-only wallet could not detect this until now).',
        );
    }

    // The fee grows with the number of inputs, so selection and fee are resolved together. Both a
    // normal send (destinations + change) and a sweep (the destination split into two outputs) end up
    // with two outputs here, so the fee estimate uses the same output count.
    const numOutputs = params.destinations.length + 1;
    const estimateFee = (numInputs: number) =>
        estimateMoneroFee({
            numInputs,
            numOutputs,
            ringSize,
            extraSize: extraSizeEstimate(numOutputs),
            baseFeePerByte: params.fee.baseFeePerByte,
            quantizationMask: params.fee.quantizationMask,
        });

    let selected;
    let fee;
    let change;
    let { destinations } = params;

    if (params.isMax) {
        // Sweep: spend everything, send (total - fee). No change, so the destination is split into two
        // outputs (Monero requires at least two). Both go to the same address.
        if (params.destinations.length !== 1) {
            throw new Error('sendMoneroTransaction: a sweep needs exactly one destination');
        }
        selected = spendable;
        fee = estimateFee(spendable.length);
        const total = spendable.reduce((sum, input) => sum + input.amount, 0);
        const sweepAmount = total - fee;
        if (sweepAmount <= 0) {
            throw new Error('Not enough spendable funds to cover the network fee.');
        }
        change = 0;
        const { address } = params.destinations[0]!;
        const half = Math.floor(sweepAmount / 2);
        destinations = [
            { address, amount: half },
            { address, amount: sweepAmount - half },
        ];
    } else {
        try {
            ({ inputs: selected, fee, change } = selectInputs(spendable, sendTotal, estimateFee));
        } catch {
            // selectInputs throws when the spendable outputs can't cover the amount + the (input-count
            // dependent) fee. Common with many small outputs, where spending more needs more inputs and
            // a bigger fee — so the full balance is never sendable. Surface a clear, actionable message.
            throw new Error(
                'Not enough spendable funds to cover the amount plus the network fee. Try a smaller amount.',
            );
        }
    }

    // Build the decoy rings for the selected inputs; their key images were already exported above and
    // ride along on each selected input. Both stay in the selected order so they line up for assembly
    // (which sorts them by key image together).
    const ownedInputs = await buildOwnedInputs(
        selected,
        params.daemon,
        params.selectDecoys,
        ringSize,
    );
    const keyImages = selected.map(input => input.keyImage);

    // Compose + sign on the device + assemble the relayable transaction.
    const signed = await signMoneroTransaction({
        inputs: ownedInputs,
        destinations,
        changeAddress: params.changeAddress,
        fee,
        account,
        keyImages,
        signer: params.signer,
    });

    // Submit to monerod EXACTLY ONCE. We deliberately do NOT run a separate do_not_relay "validation"
    // pass first: a do_not_relay submission already adds the tx to monerod's local pool, and a later
    // submission of the same tx (the form's push step, or the broadcast below) is then refused with
    // "already in tx_pool" and is never actually relayed. The tx stays stuck — unconfirmed, never
    // broadcast (so it never appears in history), with its inputs locked. Worse, under --restricted-rpc
    // that locally-pooled tx is hidden from is_key_image_spent, so the next send re-selects the locked
    // input and monerod rejects it as a double-spend. One submission avoids all of that.
    if (params.doNotRelay) {
        // The caller (send form sign step) broadcasts the returned txHex via a separate push step,
        // which is the single submission + consensus check. Don't touch the daemon here.
        return { txHex: signed.txHex, fee, change, relayed: false, keyImages: allKeyImages };
    }

    // Broadcast and, in the same call, consensus-validate the transaction.
    const relay = await params.daemon.sendRawTransaction(signed.txHex, false);
    if (!relay.ok) {
        params.onValidationFailure?.(signed.txHex, signed.txPrefixHash);
        throw new Error(
            `sendMoneroTransaction: monerod rejected the transaction (${describeRejection(relay)})`,
        );
    }

    return { txHex: signed.txHex, fee, change, relayed: true, keyImages: allKeyImages };
};
