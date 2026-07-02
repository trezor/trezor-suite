// Picks which of the wallet's spendable outputs to spend for a given send amount. The fee grows with
// the number of inputs (more inputs → bigger transaction), so selection and fee are resolved together:
// outputs are added until they cover `sendAmount + fee(currentInputCount)`.
//
// NOTE: this selects fewest-inputs-first (smallest fee). wallet2's privacy-aware selection (favouring
// older outputs, avoiding dust linkage) is a later refinement; the resulting transaction is valid
// either way. The caller decides ring size / output count, which the fee estimate must reflect.

export interface SelectableOutput {
    /** Spendable amount in piconero. */
    amount: number;
}

export interface InputSelection<T> {
    inputs: T[];
    fee: number;
    /** sum(inputs) - sendAmount - fee. May be 0 (compose then adds a dummy output for privacy). */
    change: number;
}

/**
 * @param estimateFee returns the fee for a transaction spending `numInputs` inputs (ring size and
 *   number of destinations are fixed by the caller and baked into this estimate).
 */
export const selectInputs = <T extends SelectableOutput>(
    outputs: T[],
    sendAmount: number,
    estimateFee: (numInputs: number) => number,
): InputSelection<T> => {
    if (sendAmount <= 0) {
        throw new Error('selectInputs: sendAmount must be positive');
    }

    // Fewest inputs first → smallest transaction and fee.
    const sorted = [...outputs].sort((a, b) => b.amount - a.amount);

    const inputs: T[] = [];
    let total = 0;
    for (const output of sorted) {
        inputs.push(output);
        total += output.amount;
        const fee = estimateFee(inputs.length);
        if (total >= sendAmount + fee) {
            return { inputs, fee, change: total - sendAmount - fee };
        }
    }

    throw new Error('selectInputs: insufficient funds');
};
