import { selectInputs } from '../selectInputs';

// Fee model for the tests: a flat per-input cost, so fee = numInputs * perInput.
const flatFee = (perInput: number) => (numInputs: number) => numInputs * perInput;

describe('selectInputs', () => {
    it('selects a single output that covers amount + fee', () => {
        const result = selectInputs([{ amount: 5000 }], 1000, flatFee(100));
        expect(result).toEqual({ inputs: [{ amount: 5000 }], fee: 100, change: 3900 });
    });

    it('adds outputs until they cover the (fee-inflated) target', () => {
        const result = selectInputs(
            [{ amount: 600 }, { amount: 600 }, { amount: 600 }],
            1000,
            flatFee(100),
        );
        // After 1: 600 < 1000 + 100. After 2: 1200 >= 1000 + 200 (fee grows with inputs).
        expect(result.inputs).toHaveLength(2);
        expect(result.fee).toBe(200);
        expect(result.change).toBe(0);
    });

    it('spends the largest outputs first (fewest inputs)', () => {
        const result = selectInputs([{ amount: 100 }, { amount: 9000 }], 1000, flatFee(100));
        expect(result.inputs).toEqual([{ amount: 9000 }]);
    });

    it('allows exact coverage (zero change)', () => {
        const result = selectInputs([{ amount: 1100 }], 1000, flatFee(100));
        expect(result.change).toBe(0);
    });

    it('throws on insufficient funds', () => {
        expect(() => selectInputs([{ amount: 500 }], 1000, flatFee(100))).toThrow(/insufficient/);
    });

    it('throws when the growing fee outpaces added inputs', () => {
        // Each input adds 1000 but the fee grows by 400/input; the target stays out of reach.
        expect(() =>
            selectInputs([{ amount: 1000 }, { amount: 1000 }], 1500, flatFee(400)),
        ).toThrow(/insufficient/);
    });

    it('rejects a non-positive send amount', () => {
        expect(() => selectInputs([{ amount: 1000 }], 0, flatFee(100))).toThrow(/positive/);
    });
});
