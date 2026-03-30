import {
    OUTPUT_SCRIPT_LENGTH,
    bignumberOrNaN,
    finalize,
    getDustAmount,
    getFeeForBytes,
    inputBytes,
    outputBytes,
    sumOrNaN,
    transactionBytes,
} from '../coinselectUtils';
import { type CoinSelectAlgorithm, type CoinSelectInput, type CoinSelectResult } from '../types';

const MAX_TRIES = 1000000;

function calculateEffectiveValues(utxos: CoinSelectInput[], feeRate: number) {
    return utxos.map(utxo => {
        const value = bignumberOrNaN(utxo.value);
        if (value === undefined) {
            return {
                utxo,
                effectiveValue: 0n,
            };
        }
        const effectiveFee = getFeeForBytes(feeRate, inputBytes(utxo));
        const effectiveValue = value - BigInt(effectiveFee);

        return {
            utxo,
            effectiveValue,
        };
    });
}

// Depth first search
// Inclusion branch first (Largest First Exploration), then exclusion branch
function search(
    effectiveUtxos: ReturnType<typeof calculateEffectiveValues>,
    target: bigint,
    costRange: bigint,
) {
    if (effectiveUtxos.length === 0) {
        return null;
    }

    let tries = MAX_TRIES;

    const selected: boolean[] = []; // true -> select the utxo at this index
    let selectedAccum = 0n; // sum of effective values

    let done = false;
    let backtrack = false;

    let remaining = effectiveUtxos.reduce((a, x) => x.effectiveValue + a, 0n);

    let depth = 0;
    while (!done) {
        if (tries <= 0) {
            // Too many tries, exit
            return null;
        }

        if (selectedAccum > costRange) {
            // Selected value is out of range, go back and try other branch
            backtrack = true;
        } else if (selectedAccum >= target) {
            // Selected value is within range
            done = true;
        } else if (depth >= effectiveUtxos.length) {
            // Reached a leaf node, no solution here
            backtrack = true;
        } else if (selectedAccum + remaining < target) {
            // Cannot possibly reach target with amount remaining
            if (depth === 0) {
                // At the first utxo, no possible selections, so exit
                return null;
            }
            backtrack = true;
        } else {
            // Continue down this branch
            // Remove this utxo from the remaining utxo amount
            remaining = remaining - effectiveUtxos[depth].effectiveValue;
            // Inclusion branch first (Largest First Exploration)
            selected[depth] = true;
            selectedAccum = selectedAccum + effectiveUtxos[depth].effectiveValue;
            depth++;
        }

        // Step back to the previous utxo and try the other branch
        if (backtrack) {
            backtrack = false; // Reset
            depth--;

            // Walk backwards to find the first utxo which has not has its second branch traversed
            while (!selected[depth]) {
                remaining = remaining + effectiveUtxos[depth].effectiveValue;

                // Step back one
                depth--;

                if (depth < 0) {
                    // We have walked back to the first utxo
                    // and no branch is untraversed. No solution, exit.
                    return null;
                }
            }

            // Now traverse the second branch of the utxo we have arrived at.
            selected[depth] = false;
            selectedAccum = selectedAccum - effectiveUtxos[depth].effectiveValue;
            depth++;
        }
        tries--;
    }

    return selected;
}

/*
 * Algorithm inspired by `Branch and Bound` implemented by bitcoin-core.
 * Ported from `scala` to `javascript` by @karelbilek
 * https://github.com/bitcoinjs/coinselect/issues/10#issuecomment-312392203
 *
 * Since this was done at the early stage of implementation it's not exactly 1:1 with bitcoin-core (written in c++)
 * https://github.com/bitcoin/bitcoin/blob/b2ec0326fd76e64a6d0d7e4745506b29f60d0be5/src/wallet/coinselection.cpp
 */

export const branchAndBound: CoinSelectAlgorithm = (
    utxos,
    outputs,
    feeRate,
    options,
): CoinSelectResult => {
    if (options.baseFee) return { fee: 0 }; // TEMP: disable bnb algorithm for DOGE
    if (utxos.find(u => u.required)) return { fee: 0 }; // TODO: enable bnb algorithm if required utxos are defined

    // cost of change: cost of additional output in current tx (fee) + minimum possible value of that output (dust)
    const changeOutputFee = getFeeForBytes(
        feeRate,
        outputBytes({
            script: {
                length: OUTPUT_SCRIPT_LENGTH[options.txType],
            },
        }),
    );
    const costOfChange = changeOutputFee + getDustAmount(feeRate, options);

    // calculate transaction size and fee without inputs
    const outputsBytes = transactionBytes([], outputs);
    const outputsFee = getFeeForBytes(feeRate, outputsBytes);
    const outputsTotalValue = sumOrNaN(outputs);
    if (outputsTotalValue === undefined) return { fee: 0 };

    // target = total amount that needs to be covered (all outputs + fee)
    const target = outputsTotalValue + BigInt(outputsFee);
    const targetRange = target + BigInt(costOfChange);

    // use only effective utxos which:
    // - value is greater than its cost (effectiveValue > 0)
    // - value is lower or equal than target range (will not produce change output)
    const effectiveUtxos = calculateEffectiveValues(utxos, feeRate)
        .filter(({ effectiveValue }) => effectiveValue > 0n && effectiveValue <= targetRange)
        .sort((a, b) => {
            const subtract = Number(b.effectiveValue - a.effectiveValue);
            if (subtract !== 0) {
                return subtract;
            }

            return a.utxo.i - b.utxo.i;
        });

    // check if sum of all effective utxos is greater than target (if transaction is even possible with remaining subset)
    const utxosTotalEffectiveValue = effectiveUtxos.reduce(
        (total, { effectiveValue }) => total + effectiveValue,
        0n,
    );
    if (utxosTotalEffectiveValue < target) {
        return { fee: 0 };
    }

    // start searching
    const selected = search(effectiveUtxos, target, targetRange);
    if (selected !== null) {
        const inputs: CoinSelectInput[] = [];

        for (let i = 0; i < effectiveUtxos.length; i++) {
            if (selected[i]) {
                inputs.push(effectiveUtxos[i].utxo);
            }
        }

        return finalize(inputs, outputs, feeRate, options);
    }

    return { fee: 0 };
};
