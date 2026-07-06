// Map the device's moneroSignTransaction result onto the SignedTransactionResult the assembler
// consumes. The two shapes already line up field-for-field; this only narrows to the subset the
// assembler needs and fails fast if the device omitted the RingCT base. Pure, so it is unit-testable.
import type { SignedTransactionResult } from '../tx/assemble';

/** The subset of the device's MoneroSignedTransaction the assembler relies on. */
export interface DeviceSignedTransaction {
    signatures: string[];
    rv: { rv_type?: number; txn_fee?: number };
    pseudo_outs: string[];
    out_pks: string[];
    ecdh_infos: string[];
    tx_outs: string[];
    rsig_parts: string[];
    extra?: string;
    /** The device's own tx prefix hash — carried through only for diagnostics. */
    tx_prefix_hash?: string;
}

export const toSignedTransactionResult = (
    device: DeviceSignedTransaction,
): SignedTransactionResult => ({
    signatures: device.signatures,
    rv: { rv_type: device.rv.rv_type, txn_fee: device.rv.txn_fee },
    pseudo_outs: device.pseudo_outs,
    out_pks: device.out_pks,
    ecdh_infos: device.ecdh_infos,
    tx_outs: device.tx_outs,
    rsig_parts: device.rsig_parts,
    extra: device.extra,
    tx_prefix_hash: device.tx_prefix_hash,
});
