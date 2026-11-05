import {
    COORDINATION_FEE_RATE_ZERO,
    MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
    ScriptType,
    effectiveValue,
    estimateInputVsize,
    estimateOutputVsize,
    feeRateFromSatoshiPerKvByte,
    feeRateFromSatoshiPerVByte,
    getCoordinationFee,
    getFee,
    getScriptTypeFromScriptPubKey,
    moneyRangeContains,
    parseScriptType,
} from './money';

describe('money', () => {
    it('uses the NBitcoin script type encoding the coordinator sends', () => {
        // The enum has no explicit values, so P2WPKH is 4 and Taproot is 7. The committed
        // SelectInputsForRound vector sends exactly `[4, 7]`.
        expect(ScriptType.P2WPKH).toBe(4);
        expect(ScriptType.Taproot).toBe(7);
        expect(parseScriptType('P2WPKH')).toBe(ScriptType.P2WPKH);
        expect(parseScriptType('Taproot')).toBe(ScriptType.Taproot);
        expect(parseScriptType(4)).toBe(ScriptType.P2WPKH);
        expect(() => parseScriptType('P2TR' as 'Taproot')).toThrow('Unknown script type');
        expect(() => parseScriptType(99)).toThrow('Unknown script type');
    });

    it('knows the upstream virtual sizes', () => {
        expect(estimateInputVsize(ScriptType.P2WPKH)).toBe(69);
        expect(estimateOutputVsize(ScriptType.P2WPKH)).toBe(31);
        expect(estimateInputVsize(ScriptType.Taproot)).toBe(58);
        expect(estimateOutputVsize(ScriptType.Taproot)).toBe(43);
        expect(() => estimateInputVsize(ScriptType.P2PKH)).toThrow("isn't implemented");
        expect(() => estimateOutputVsize(ScriptType.P2SH)).toThrow("isn't implemented");
    });

    describe('getFee', () => {
        it('truncates the division', () => {
            // The values the committed vectors depend on.
            expect(getFee({ feePerK: 129_000 }, 43)).toBe(5_547);
            expect(getFee({ feePerK: 129_000 }, 58)).toBe(7_482);
            expect(getFee({ feePerK: 100 }, 43)).toBe(4);
            expect(getFee({ feePerK: 100 }, 58)).toBe(5);
        });

        it('turns a truncated-to-zero fee into one satoshi, even at a zero fee rate', () => {
            // `if (nFee == Money.Zero) nFee = Money.Satoshis(1.0m);` — unconditional.
            expect(getFee({ feePerK: 0 }, 43)).toBe(1);
            expect(getFee({ feePerK: 10 }, 43)).toBe(1);
            expect(getFee({ feePerK: 100 }, 1)).toBe(1);
        });

        it('rejects a negative fee rate', () => {
            expect(() => feeRateFromSatoshiPerKvByte(-1)).toThrow('cannot be less than 0');
        });

        it('converts satoshis per virtual byte', () => {
            expect(feeRateFromSatoshiPerVByte(5).feePerK).toBe(5_000);
            expect(feeRateFromSatoshiPerVByte(100).feePerK).toBe(100_000);
            expect(feeRateFromSatoshiPerKvByte(12_000).feePerK).toBe(12_000);
        });
    });

    describe('getCoordinationFee', () => {
        const rate = { Rate: 0.003, PlebsDontPayThreshold: 1_000_000 };

        it('exempts plebs', () => {
            expect(getCoordinationFee(rate, 1_000_000)).toBe(0);
            expect(getCoordinationFee(rate, 999_999)).toBe(0);
        });

        it('floors the product', () => {
            expect(getCoordinationFee(rate, 1_000_001)).toBe(3_000);
            expect(getCoordinationFee(rate, 20_000_000)).toBe(60_000);
            expect(getCoordinationFee(rate, 1_000_000_000)).toBe(3_000_000);
        });

        it('is exact where floating point would floor one satoshi low', () => {
            // 7000 * 0.0003 is 2.0999999999999996 as a double, so `Math.floor` of the
            // float product gives 2 where the decimal product is exactly 2.1 -> 2; but
            // 10000 * 0.0003 is 2.9999999999999996, where the decimal is exactly 3.
            expect(getCoordinationFee({ Rate: 0.0003, PlebsDontPayThreshold: 0 }, 10_000)).toBe(3);
            expect(getCoordinationFee({ Rate: 0.007, PlebsDontPayThreshold: 0 }, 1_100)).toBe(7);
        });

        it('is zero for a zero rate', () => {
            expect(getCoordinationFee(COORDINATION_FEE_RATE_ZERO, 1_000_000_000)).toBe(0);
        });
    });

    it('computes the effective value of an input', () => {
        // 20_000_000 sats, taproot input (58 vb) at 12 sat/vb, 0.3% coordination fee.
        expect(
            effectiveValue(
                20_000_000,
                ScriptType.Taproot,
                { feePerK: 12_000 },
                { Rate: 0.003, PlebsDontPayThreshold: 1_000_000 },
            ),
        ).toBe(20_000_000 - 696 - 60_000);
    });

    it('bounds amounts inside the safe integer range', () => {
        expect(MAXIMUM_NUMBER_OF_BITCOINS_MONEY).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(Number.isSafeInteger(MAXIMUM_NUMBER_OF_BITCOINS_MONEY)).toBe(true);
    });

    it('checks money ranges inclusively', () => {
        const range = { Min: 10, Max: 20 };
        expect(moneyRangeContains(range, 10)).toBe(true);
        expect(moneyRangeContains(range, 20)).toBe(true);
        expect(moneyRangeContains(range, 9)).toBe(false);
        expect(moneyRangeContains(range, 21)).toBe(false);
    });

    describe('getScriptTypeFromScriptPubKey', () => {
        it('classifies the script types a round can allow', () => {
            expect(getScriptTypeFromScriptPubKey(`0014${'ab'.repeat(20)}`)).toBe(ScriptType.P2WPKH);
            expect(
                getScriptTypeFromScriptPubKey(
                    '51207dd17022d0288f10baf1ec6420473f6a0523e4521c155f4056845ca983d0f26f',
                ),
            ).toBe(ScriptType.Taproot);
            expect(getScriptTypeFromScriptPubKey(`0020${'ab'.repeat(32)}`)).toBe(ScriptType.P2WSH);
            expect(
                getScriptTypeFromScriptPubKey('76a914ce926a6e50d2f12dd1fe3bda4521df3a13bb4bcb88ac'),
            ).toBe(ScriptType.P2PKH);
            expect(getScriptTypeFromScriptPubKey(`a914${'ab'.repeat(20)}87`)).toBe(ScriptType.P2SH);
            expect(getScriptTypeFromScriptPubKey(`21${'ab'.repeat(33)}ac`)).toBe(ScriptType.P2PK);
        });

        it('returns undefined for anything it cannot classify', () => {
            expect(getScriptTypeFromScriptPubKey('')).toBeUndefined();
            expect(getScriptTypeFromScriptPubKey('6a00')).toBeUndefined();
            // The coordinator's own `"0 <hash>"` format is not raw hex, and Suite must
            // send the hex form for utxos.
            expect(getScriptTypeFromScriptPubKey(`0 ${'ab'.repeat(20)}`)).toBeUndefined();
        });
    });
});
