import * as utils from '../utils';

const maxTries = 1000000;

function calculateEffectiveValues(utxos, feeRate) {
    return utxos.map((utxo) => {
        if (Number.isNaN(utils.uintOrNaN(utxo.value))) {
            return {
                utxo,
                effectiveValue: 0,
            };
        }

        const effectiveFee = utils.inputBytes(utxo) * feeRate;
        const effectiveValue = utxo.value - effectiveFee;
        return {
            utxo,
            effectiveValue,
        };
    });
}

export default function branchAndBound(factor) {
    return (utxos, outputs, feeRate, options) => {
        const { inputLength, changeOutputLength, dustThreshold: explicitDustThreshold } = options;

        if (!Number.isFinite(utils.uintOrNaN(feeRate))) return {};

        const costPerChangeOutput = utils.outputBytes({
            script: {
                length: changeOutputLength,
            },
        }) * feeRate;
        const costPerInput = utils.inputBytes({
            script: {
                length: inputLength,
            },
        }) * feeRate;
        const costOfChange = Math.floor((costPerInput + costPerChangeOutput) * factor);

        const outAccum = utils.sumOrNaN(outputs) + utils.transactionBytes([], outputs) * feeRate;

        if (Number.isNaN(outAccum)) {
            return {
                fee: 0,
            };
        }

        const effectiveUtxos = calculateEffectiveValues(utxos, feeRate)
            .filter(x => x.effectiveValue > 0)
            .sort((a, b) => {
                if (b.effectiveValue - a.effectiveValue !== 0) {
                    return b.effectiveValue - a.effectiveValue;
                }
                return a.utxo.i - b.utxo.i;
            });

        const selected = search(effectiveUtxos, outAccum, costOfChange);
        if (selected != null) {
            const inputs = [];

            for (let i = 0; i < effectiveUtxos.length; i++) {
                if (selected[i]) {
                    inputs.push(effectiveUtxos[i].utxo);
                }
            }

            return utils.finalize(
                inputs,
                outputs,
                feeRate,
                inputLength,
                changeOutputLength,
                explicitDustThreshold,
            );
        }
        return {
            fee: 0,
        };
    };
}

// Depth first search
// Inclusion branch first (Largest First Exploration), then exclusion branch
function search(effectiveUtxos, target, costOfChange) {
    if (effectiveUtxos.length === 0) {
        return null;
    }

    let tries = maxTries;

    const selected = []; // true -> select the utxo at this index
    let selectedAccum = 0; // sum of effective values

    let done = false;
    let backtrack = false;

    let remaining = effectiveUtxos.reduce((a, x) => a + x.effectiveValue, 0);

    let depth = 0;
    while (!done) {
        if (tries <= 0) { // Too many tries, exit
            return null;
        }

        if (selectedAccum > target + costOfChange) {
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
        } else { // Continue down this branch
            // Remove this utxo from the remaining utxo amount
            remaining -= effectiveUtxos[depth].effectiveValue;
            // Inclusion branch first (Largest First Exploration)
            selected[depth] = true;
            selectedAccum += effectiveUtxos[depth].effectiveValue;
            depth++;
        }

        // Step back to the previous utxo and try the other branch
        if (backtrack) {
            backtrack = false; // Reset
            depth--;

            // Walk backwards to find the first utxo which has not has its second branch traversed
            while (!selected[depth]) {
                remaining += effectiveUtxos[depth].effectiveValue;

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
            selectedAccum -= effectiveUtxos[depth].effectiveValue;
            depth++;
        }
        tries--;
    }

    return selected;
}
