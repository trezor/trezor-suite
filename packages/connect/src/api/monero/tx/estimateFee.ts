// Port of wallet2 `estimate_rct_tx_size` + `estimate_tx_weight` + `calculate_fee_from_weight`,
// specialised to current Monero consensus: RingCT, BulletproofPlus range proofs, CLSAG signatures and
// view tags. The fee must match what the daemon will require, so this mirrors wallet2 exactly (a
// too-low fee is rejected by consensus). Validated against the real HF15 transaction in the tests.

const VIEW_TAG_SIZE = 1; // sizeof(crypto::view_tag)
// Notional size of a 2-output BulletproofPlus proof, normalized to one proof (wallet2 bp_base).
const BP_PLUS_CONST = 6; // (bulletproof_plus ? 6 : 9)

/** Estimated serialized size (bytes) of a RingCT BulletproofPlus+CLSAG transaction. */
export const estimateRctTxSize = (
    numInputs: number,
    mixin: number,
    numOutputs: number,
    extraSize: number,
): number => {
    let size = 0;

    // tx prefix: version + unlock_time
    size += 1 + 6;
    // vin: per input — tag + amount + (mixin+1) key offsets (2 bytes each) + key image
    size += numInputs * (1 + 6 + (mixin + 1) * 2 + 32);
    // vout: per output — amount + one-time key (view tag added below)
    size += numOutputs * (6 + 32);
    // tx_extra
    size += extraSize;

    // rct signatures: type
    size += 1;
    // range proofs (BulletproofPlus)
    let logPaddedOutputs = 0;
    while (1 << logPaddedOutputs < numOutputs) logPaddedOutputs += 1;
    size += (2 * (6 + logPaddedOutputs) + BP_PLUS_CONST) * 32 + 3;
    // CLSAGs
    size += numInputs * (32 * (mixin + 1) + 64);
    // view tags
    size += numOutputs * VIEW_TAG_SIZE;
    // pseudoOuts
    size += 32 * numInputs;
    // ecdhInfo (amount only)
    size += 8 * numOutputs;
    // outPk (commitment only)
    size += 32 * numOutputs;
    // txnFee
    size += 4;

    return size;
};

/** Estimated transaction weight (bytes), which adds the BulletproofPlus clawback for >2 outputs. */
export const estimateTxWeight = (
    numInputs: number,
    mixin: number,
    numOutputs: number,
    extraSize: number,
): number => {
    let size = estimateRctTxSize(numInputs, mixin, numOutputs, extraSize);

    if (numOutputs > 2) {
        const bpBase = (32 * (BP_PLUS_CONST + 7 * 2)) / 2;
        let logPaddedOutputs = 2;
        while (1 << logPaddedOutputs < numOutputs) logPaddedOutputs += 1;
        const nlr = 2 * (6 + logPaddedOutputs);
        const bpSize = 32 * (BP_PLUS_CONST + nlr);
        const bpClawback = Math.floor(((bpBase * (1 << logPaddedOutputs) - bpSize) * 4) / 5);
        size += bpClawback;
    }

    return size;
};

/** Rounds `weight * baseFeePerByte` up to the next multiple of the quantization mask (wallet2). */
export const calculateFeeFromWeight = (
    baseFeePerByte: number,
    weight: number,
    quantizationMask: number,
): number => {
    const fee = weight * baseFeePerByte;
    const mask = quantizationMask > 0 ? quantizationMask : 1;

    return Math.ceil(fee / mask) * mask;
};

export interface FeeParams {
    numInputs: number;
    numOutputs: number;
    ringSize: number;
    extraSize: number;
    /** Per-byte base fee for the chosen priority (get_fee_estimate `fee` / `fees[priority]`). */
    baseFeePerByte: number;
    /** Fee quantization mask from get_fee_estimate (rounding granularity). */
    quantizationMask: number;
}

export const estimateMoneroFee = ({
    numInputs,
    numOutputs,
    ringSize,
    extraSize,
    baseFeePerByte,
    quantizationMask,
}: FeeParams): number => {
    const weight = estimateTxWeight(numInputs, ringSize - 1, numOutputs, extraSize);

    return calculateFeeFromWeight(baseFeePerByte, weight, quantizationMask);
};
