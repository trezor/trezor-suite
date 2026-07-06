// Protocol driver: tie the construction, device signing and assembly together.
//
//   composeMoneroTransaction (tsx_data + source entries)
//     -> sign on the device (moneroSignTransaction, the 8-step protocol)
//     -> assembleSignedTransaction (serialized, relayable tx)
//
// The device signer is injected so this stays testable and decoupled from @trezor/connect's method
// plumbing; in production it is a thin wrapper over TrezorConnect.moneroSignTransaction. The key
// images (one per input, from moneroKeyImageSync) are supplied by the caller — they live in the
// final input vins, which the device does not return.
import { type SignedTransactionResult, assembleSignedTransaction } from './assemble';
import {
    type ComposeParams,
    type SourceEntry,
    type TransactionData,
    composeMoneroTransaction,
} from './buildTransaction';
import { toRelativeOffsets } from './ring';

export type MoneroDeviceSigner = (
    tsxData: TransactionData,
    inputs: SourceEntry[],
) => Promise<SignedTransactionResult>;

export interface SignParams extends ComposeParams {
    /** One key image per input, same order as `inputs` (from moneroKeyImageSync). */
    keyImages: Uint8Array[];
    signer: MoneroDeviceSigner;
}

export interface SignedTransaction {
    txHex: string;
    tsxData: TransactionData;
    inputs: SourceEntry[];
    /** The device's own tx prefix hash — diagnostics only (compare against the assembled prefix). */
    txPrefixHash?: string;
}

// memcmp over the raw bytes; returns <0 / 0 / >0 like C++ std::memcmp.
const compareBytes = (a: Uint8Array, b: Uint8Array): number => {
    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; i++) {
        if (a[i] !== b[i]) {
            return a[i]! - b[i]!;
        }
    }

    return a.length - b.length;
};

export const signMoneroTransaction = async (params: SignParams): Promise<SignedTransaction> => {
    if (params.keyImages.length !== params.inputs.length) {
        throw new Error('signMoneroTransaction: one key image per input is required');
    }

    // Monero consensus requires a transaction's inputs (vin) to be ordered by key image,
    // descending (memcmp byte order); monerod rejects an unsorted vin. This driver runs the whole
    // pipeline (device SetInput/InputVini/SignInput and the assembled prefix) in a single input
    // order, so sorting the (input, key image) pairs up front yields a correctly ordered tx.
    // NOTE: the spend flow is not yet wired to a live path; the ordering still needs an on-device
    // + monerod round-trip to confirm the firmware accepts inputs presented in this order.
    const order = params.keyImages
        .map((keyImage, index) => ({ keyImage, index }))
        .sort((a, b) => compareBytes(b.keyImage, a.keyImage))
        .map(entry => entry.index);

    for (let i = 1; i < order.length; i++) {
        if (compareBytes(params.keyImages[order[i - 1]!]!, params.keyImages[order[i]!]!) === 0) {
            throw new Error('signMoneroTransaction: duplicate key image');
        }
    }

    const sortedInputs = order.map(index => params.inputs[index]!);
    const sortedKeyImages = order.map(index => params.keyImages[index]!);

    const { tsxData, inputs } = composeMoneroTransaction({ ...params, inputs: sortedInputs });

    const result = await params.signer(tsxData, inputs);

    const ringSize = inputs[0]!.outputs.length;
    const txHex = assembleSignedTransaction(result, {
        unlockTime: tsxData.unlock_time,
        ringSize,
        vin: inputs.map((input, i) => ({
            keyOffsets: toRelativeOffsets(input.outputs.map(output => output.idx)),
            keyImage: sortedKeyImages[i]!,
        })),
    });

    return { txHex, tsxData, inputs, txPrefixHash: result.tx_prefix_hash };
};
