import BN from 'bn.js';
import {
    bignumberOrNaN,
    sumOrNaN,
    inputBytes,
    outputBytes,
    transactionBytes,
    getFeeForBytes,
    getDustAmount,
    finalize,
    ZERO,
    OUTPUT_SCRIPT_LENGTH,
} from '../coinselectUtils';
import {
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOptions,
    CoinSelectResult,
} from '../../types';

const MAX_TRIES = 1000000;

function calculateEffectiveValues(utxos: CoinSelectInput[], feeRate: number) {
    return utxos.map(utxo => {
        const value = bignumberOrNaN(utxo.value);
        if (!value) {
            return {
                utxo,
                effectiveValue: ZERO,
            };
        }
        const effectiveFee = getFeeForBytes(feeRate, inputBytes(utxo));
        const effectiveValue = value.sub(new BN(effectiveFee));
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
    target: BN,
    costRange: BN,
) {
    if (effectiveUtxos.length === 0) {
        return null;
    }

    let tries = MAX_TRIES;

    const selected: boolean[] = []; // true -> select the utxo at this index
    let selectedAccum = ZERO; // sum of effective values

    let done = false;
    let backtrack = false;

    let remaining = effectiveUtxos.reduce((a, x) => x.effectiveValue.add(a), ZERO);

    let depth = 0;
    while (!done) {
        if (tries <= 0) {
            // Too many tries, exit
            return null;
        }

        if (selectedAccum.gt(costRange)) {
            // Selected value is out of range, go back and try other branch
            backtrack = true;
        } else if (selectedAccum.gte(target)) {
            // Selected value is within range
            done = true;
        } else if (depth >= effectiveUtxos.length) {
            // Reached a leaf node, no solution here
            backtrack = true;
        } else if (selectedAccum.add(remaining).lt(target)) {
            // Cannot possibly reach target with amount remaining
            if (depth === 0) {
                // At the first utxo, no possible selections, so exit
                return null;
            }
            backtrack = true;
        } else {
            // Continue down this branch
            // Remove this utxo from the remaining utxo amount
            remaining = remaining.sub(effectiveUtxos[depth].effectiveValue);
            // Inclusion branch first (Largest First Exploration)
            selected[depth] = true;
            selectedAccum = selectedAccum.add(effectiveUtxos[depth].effectiveValue);
            depth++;
        }

        // Step back to the previous utxo and try the other branch
        if (backtrack) {
            backtrack = false; // Reset
            depth--;

            // Walk backwards to find the first utxo which has not has its second branch traversed
            while (!selected[depth]) {
                remaining = remaining.add(effectiveUtxos[depth].effectiveValue);

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
            selectedAccum = selectedAccum.sub(effectiveUtxos[depth].effectiveValue);
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

export function bnb(
    utxos: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
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
    if (!outputsTotalValue) return { fee: 0 };

    // target = total amount that needs to be covered (all outputs + fee)
    const target = outputsTotalValue.add(new BN(outputsFee));
    const targetRange = target.add(new BN(costOfChange));

    // use only effective utxos which:
    // - value is greater than its cost (effectiveValue > 0)
    // - value is lower or equal than target range (will not produce change output)
    const effectiveUtxos = calculateEffectiveValues(utxos, feeRate)
        .filter(({ effectiveValue }) => effectiveValue.gt(ZERO) && effectiveValue.lte(targetRange))
        .sort((a, b) => {
            const subtract = b.effectiveValue.sub(a.effectiveValue).toNumber();
            if (subtract !== 0) {
                return subtract;
            }
            return a.utxo.i - b.utxo.i;
        });

    // check if sum of all effective utxos is greater than target (if transaction is even possible with remaining subset)
    const utxosTotalEffectiveValue = effectiveUtxos.reduce(
        (total, { effectiveValue }) => total.add(effectiveValue),
        ZERO,
    );
    if (utxosTotalEffectiveValue.lt(target)) {
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
}
