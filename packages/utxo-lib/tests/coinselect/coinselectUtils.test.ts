import BN from 'bn.js';

import {
    bignumberOrNaN,
    getDustAmount,
    getFee,
    getFeePolicy,
    getVarIntSize,
} from '../../src/coinselect/coinselectUtils';
import { zcash as zcashNetwork } from '../../src/networks';

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

    // Bitcoin varint encoding sizes per Bitcoin protocol:
    // < 0xfd (253) -> 1 byte; < 0x10000 (65536) -> 3 bytes (0xfd + uint16);
    // < 0x100000000 -> 5 bytes (0xfe + uint32); else -> 9 bytes (0xff + uint64).
    it('getVarIntSize returns Bitcoin varint encoded length in bytes for boundary inputs', () => {
        expect(getVarIntSize(0)).toEqual(1);
        expect(getVarIntSize(252)).toEqual(1);
        expect(getVarIntSize(253)).toEqual(3);
        expect(getVarIntSize(65535)).toEqual(3);
        expect(getVarIntSize(65536)).toEqual(5);
        expect(getVarIntSize(4294967295)).toEqual(5);
        expect(getVarIntSize(4294967296)).toEqual(9);
    });

    it('getBaseFee', () => {
        expect(getFee([], [{ script: { length: 37 } }], 1.33)).toEqual(75);
        expect(getFee([], [{ script: { length: 81 } }], 1)).toEqual(100);
        expect(getFee([], [{ script: { length: 181 } }], 1)).toEqual(200);
        // without floor
        expect(getFee([], [{ script: { length: 181 } }], 1, { baseFee: 1000 })).toEqual(1200);
        // with floor
        expect(
            getFee([], [{ script: { length: 181 } }], 1, { baseFee: 1000, floorBaseFee: true }),
        ).toEqual(1000);
    });

    it('getFeePolicy returns "zcash" for the zcash network', () => {
        // Exercises the truthy arm of the isNetworkType('zcash', network) branch in getFeePolicy.
        expect(getFeePolicy(zcashNetwork)).toEqual('zcash');
    });

    it('getDogeFee with no dustThreshold option uses 0 default and adds no dust surcharge', () => {
        // feePolicy='doge' routes to getDogeFee, options spread without dustThreshold
        // exercises the default-arg branch `dustThreshold = 0` in getDogeFee destructuring.
        // Expected = getBitcoinFee result (baseFee=0 default, no floor).
        // transactionWeight = TX_BASE(32) + 4*varInt(0)(=4) + 4*varInt(1)(=4) + 4*(8+1+37)(=184) = 224
        // bytes = ceil(224/4) = 56, defaultFee = ceil(1.33 * 56) = 75
        expect(getFee([], [{ script: { length: 37 } }], 1.33, { feePolicy: 'doge' })).toEqual(75);
    });

    it('getDogeFee', () => {
        expect(
            getFee(
                [],
                [
                    { value: new BN('8'), script: { length: 49 } },
                    { value: new BN('7'), script: { length: 50 } },
                ],
                2,
                { feePolicy: 'doge', baseFee: 1000, dustThreshold: 1000 },
            ),
        ).toEqual(3254);
        expect(
            getFee(
                [],
                [
                    { value: new BN('8'), script: { length: 500 } },
                    { value: new BN('7'), script: { length: 472 } },
                ],
                2,
                { feePolicy: 'doge', baseFee: 1000, dustThreshold: 1000, floorBaseFee: true },
            ),
        ).toEqual(5000);
    });

    it('getZcashFee', () => {
        const IN = {
            type: 'p2pkh',
            i: 0,
            value: new BN('1000'),
            confirmations: 0,
            script: { length: 108 },
        } as const;
        const OUT = { script: { length: 25 } };

        expect(getFee([], [], 10, { feePolicy: 'zcash' })).toBe(10000);
        expect(getFee([IN], [OUT], 10, { feePolicy: 'zcash' })).toBe(10000);
        expect(getFee([IN, IN], [OUT], 10, { feePolicy: 'zcash' })).toBe(10000);
        expect(getFee([IN], [OUT, OUT, OUT], 10, { feePolicy: 'zcash' })).toBe(15000);
        expect(getFee([IN], [OUT], 60, { feePolicy: 'zcash' })).toBe(11520); // fee per byte is higher
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
