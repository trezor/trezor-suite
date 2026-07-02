import {
    calculateFeeFromWeight,
    estimateMoneroFee,
    estimateRctTxSize,
    estimateTxWeight,
} from '../estimateFee';
import { ByteReader } from '../serialize';
import { readTransactionPrefix } from '../transaction';
import { TX_HF15_HEX } from './fixtures/txHf15';

describe('estimateRctTxSize', () => {
    it('approximates the real HF15 transaction size (4 inputs, ring 16, 3 outputs)', () => {
        const real = TX_HF15_HEX.length / 2;
        const { extra } = readTransactionPrefix(new ByteReader(Buffer.from(TX_HF15_HEX, 'hex')));

        const estimate = estimateRctTxSize(4, 15, 3, extra.length);

        // The estimate uses fixed field widths (varints approximated), so it is close but not exact.
        expect(Math.abs(estimate - real)).toBeLessThan(real * 0.05);
    });
});

describe('estimateTxWeight', () => {
    it('equals the size when there are 2 or fewer outputs (no clawback)', () => {
        expect(estimateTxWeight(2, 15, 2, 44)).toBe(estimateRctTxSize(2, 15, 2, 44));
    });

    it('adds the BulletproofPlus clawback above 2 outputs', () => {
        const size = estimateRctTxSize(2, 15, 5, 44);
        expect(estimateTxWeight(2, 15, 5, 44)).toBeGreaterThan(size);
    });
});

describe('calculateFeeFromWeight', () => {
    it('multiplies weight by the per-byte fee', () => {
        expect(calculateFeeFromWeight(20000, 2000, 10000)).toBe(40_000_000);
    });

    it('rounds up to the next multiple of the quantization mask', () => {
        // 15 * 7 = 105 → next multiple of 100 is 200.
        expect(calculateFeeFromWeight(7, 15, 100)).toBe(200);
    });
});

describe('estimateMoneroFee', () => {
    it('combines weight and per-byte fee for a typical 1-in/2-out transaction', () => {
        const weight = estimateTxWeight(1, 15, 2, 44);
        const fee = estimateMoneroFee({
            numInputs: 1,
            numOutputs: 2,
            ringSize: 16,
            extraSize: 44,
            baseFeePerByte: 20000,
            quantizationMask: 10000,
        });
        expect(fee).toBe(calculateFeeFromWeight(20000, weight, 10000));
        expect(fee).toBeGreaterThan(0);
    });
});
