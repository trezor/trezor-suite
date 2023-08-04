import { bignumberOrNaN, getFee, getDustAmount } from '../../src/coinselect/coinselectUtils';

describe('coinselectUtils', () => {
    it('bignumberOrNaN', () => {
        expect(bignumberOrNaN('1')).not.toBeUndefined();
        expect(bignumberOrNaN('1.1')).toBeUndefined();
        expect(bignumberOrNaN('-1')).toBeUndefined();
        expect(bignumberOrNaN('')).toBeUndefined();
        expect(bignumberOrNaN('deadbeef')).toBeUndefined();
        expect(bignumberOrNaN('0x dead beef')).toBeUndefined();
        expect(bignumberOrNaN('1.1')).toBeUndefined();
        expect(bignumberOrNaN()).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(1)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(-1, true)).not.toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(Infinity)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(NaN)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(1.1)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN(-1)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(bignumberOrNaN({})).toBeUndefined();
    });

    it('getBaseFee', () => {
        expect(getFee(1.33, 56, {}, [])).toEqual(75);
        expect(getFee(1, 100, {}, [])).toEqual(100);
        expect(getFee(1, 200, {}, [])).toEqual(200);
        // without floor
        expect(getFee(1, 200, { baseFee: 1000 }, [])).toEqual(1200);
        expect(
            getFee(
                2,
                127,
                {
                    baseFee: 1000,
                    dustOutputFee: 1000,
                    dustThreshold: 9,
                },
                [
                    { value: '8', script: { length: 0 } },
                    { value: '7', script: { length: 0 } },
                ],
            ),
        ).toEqual(3254);

        // with floor
        expect(getFee(1, 200, { baseFee: 1000, floorBaseFee: true }, [])).toEqual(1000);
        expect(
            getFee(
                2,
                1000,
                {
                    baseFee: 1000,
                    dustOutputFee: 1000,
                    dustThreshold: 9,
                    floorBaseFee: true,
                },
                [
                    { value: '8', script: { length: 0 } },
                    { value: '7', script: { length: 0 } },
                ],
            ),
        ).toEqual(5000);
    });

    it('getDustAmount', () => {
        // NOTE: p2wsh case in intentionally not tested as INPUT_SCRIPT_LENGTH.p2wsh is not quite accurate and waits for the implementation of multisig

        // without explicit dustThreshold and longTermFeeRate
        // with minimum feeRate
        // calculated from inputSize * default dustRelayFeeRate (3)
        expect(getDustAmount(1, { txType: 'p2pkh' })).toEqual(148 * 3);
        expect(getDustAmount(1, { txType: 'p2sh' })).toEqual(91 * 3);
        expect(getDustAmount(1, { txType: 'p2tr' })).toEqual(58 * 3);
        expect(getDustAmount(1, { txType: 'p2wpkh' })).toEqual(68 * 3);

        // with explicit longTermFeeRate higher than default dustRelayFeeRate (3)
        // with feeRate higher than longTermFeeRate
        // without explicit dustThreshold
        // calculated from inputSize * longTermFeeRate
        expect(getDustAmount(10, { txType: 'p2pkh', longTermFeeRate: 5 })).toEqual(148 * 5);
        expect(getDustAmount(10, { txType: 'p2sh', longTermFeeRate: 5 })).toEqual(91 * 5);
        expect(getDustAmount(10, { txType: 'p2tr', longTermFeeRate: 5 })).toEqual(58 * 5);
        expect(getDustAmount(10, { txType: 'p2wpkh', longTermFeeRate: 5 })).toEqual(68 * 5);

        // with explicit longTermFeeRate higher than default dustRelayFeeRate (3)
        // with feeRate lower than longTermFeeRate
        // without explicit dustThreshold
        // calculated from inputSize * longTermFeeRate
        expect(getDustAmount(5, { txType: 'p2pkh', longTermFeeRate: 10 })).toEqual(148 * 5);
        expect(getDustAmount(5, { txType: 'p2sh', longTermFeeRate: 10 })).toEqual(91 * 5);
        expect(getDustAmount(5, { txType: 'p2tr', longTermFeeRate: 10 })).toEqual(58 * 5);
        expect(getDustAmount(5, { txType: 'p2wpkh', longTermFeeRate: 10 })).toEqual(68 * 5);

        // with explicit dustThreshold and longTermFeeRate
        // with feeRate higher than longTermFeeRate
        expect(
            getDustAmount(10, { txType: 'p2pkh', dustThreshold: 546, longTermFeeRate: 5 }),
        ).toEqual(740); // longTermFeeRate makes it higher than dustThreshold
        expect(
            getDustAmount(10, { txType: 'p2sh', dustThreshold: 546, longTermFeeRate: 5 }),
        ).toEqual(546); // dustThreshold is higher than 91 * 5 (455)
        expect(
            getDustAmount(10, { txType: 'p2tr', dustThreshold: 546, longTermFeeRate: 5 }),
        ).toEqual(546); // dustThreshold is higher than 58 * 5 (290)
        expect(
            getDustAmount(10, { txType: 'p2wpkh', dustThreshold: 546, longTermFeeRate: 5 }),
        ).toEqual(546); // dustThreshold is higher than 68 * 5 (340)

        // DOGE with high dustThreshold
        expect(
            getDustAmount(1000, { txType: 'p2pkh', dustThreshold: 100000000, longTermFeeRate: 5 }),
        ).toEqual(100000000); // dustThreshold is really high
    });
});
