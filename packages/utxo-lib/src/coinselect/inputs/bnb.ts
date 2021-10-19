import * as BN from 'bn.js';
import * as utils from '../utils';
import type { CoinSelectAlgorithm, CoinSelectInput } from '../index';

const MAX_TRIES = 1000000;

function calculateEffectiveValues(utxos: CoinSelectInput[], feeRate: number) {
    return utxos.map(utxo => {
        const value = utils.bignumberOrNaN(utxo.value);
        if (!value) {
            return {
                utxo,
                effectiveValue: new BN(0),
            };
        }
        const effectiveFee = utils.inputBytes(utxo) * feeRate;
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
    costOfChange: number,
) {
    if (effectiveUtxos.length === 0) {
        return null;
    }

    let tries = MAX_TRIES;

    const selected: boolean[] = []; // true -> select the utxo at this index
    let selectedAccum = new BN(0); // sum of effective values

    let done = false;
    let backtrack = false;

    let remaining = effectiveUtxos.reduce((a, x) => x.effectiveValue.add(a), new BN(0));
    const costRange = target.add(new BN(costOfChange));

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

// branchAndBound
export function bnb(factor: number): CoinSelectAlgorithm {
    return (utxos, outputs, feeRate, options) => {
        if (typeof utils.uintOrNaN(feeRate) !== 'number') return { fee: 0 };
        if (options.baseFee) return { fee: 0 }; // TEMP: disable bnb algorithm for DOGE
        if (utxos.find(u => u.required)) return { fee: 0 }; // TODO: enable bnb algorithm if required utxos are defined

        const { inputLength, changeOutputLength } = options;

        const costPerChangeOutput =
            utils.outputBytes({
                script: {
                    length: changeOutputLength,
                },
            }) * feeRate;

        const costPerInput =
            utils.inputBytes({
                script: {
                    length: inputLength,
                },
            }) * feeRate;

        const costOfChange = Math.floor((costPerInput + costPerChangeOutput) * factor);
        const txBytes = utils.transactionBytes([], outputs);
        const bytesAndFee = feeRate * txBytes;

        const outSum = utils.sumOrNaN(outputs);
        if (!outSum) return { fee: 0 };

        const outAccum = outSum.add(new BN(bytesAndFee));

        const effectiveUtxos = calculateEffectiveValues(utxos, feeRate)
            .filter(x => x.effectiveValue.gt(utils.ZERO))
            .sort((a, b) => {
                const subtract = b.effectiveValue.sub(a.effectiveValue).toNumber();
                if (subtract !== 0) {
                    return subtract;
                }
                return a.utxo.i - b.utxo.i;
            });

        const selected = search(effectiveUtxos, outAccum, costOfChange);
        if (selected !== null) {
            const inputs: CoinSelectInput[] = [];

            for (let i = 0; i < effectiveUtxos.length; i++) {
                if (selected[i]) {
                    inputs.push(effectiveUtxos[i].utxo);
                }
            }

            return utils.finalize(inputs, outputs, feeRate, options);
        }

        return { fee: 0 };
    };
}
