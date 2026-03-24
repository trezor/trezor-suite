import { type Bip329Label } from '@suite-common/bip329-types';
import { type AccountLabels } from '@suite-common/metadata-types';

// Transforms a custom SLIP-15 like wallet label object into an array of BIP-329 label objects.

export const slip15ToBip329 = (inputData: AccountLabels, allSpendable = true): Bip329Label[] => {
    const bip329Labels: Bip329Label[] = [];

    // `outputLabels` -> mapped to BIP-329 'utxo' type
    if (inputData.outputLabels) {
        for (const txid in inputData.outputLabels) {
            if (Object.prototype.hasOwnProperty.call(inputData.outputLabels, txid)) {
                const outputs = inputData.outputLabels[txid];

                for (const vout in outputs) {
                    if (Object.prototype.hasOwnProperty.call(outputs, vout)) {
                        bip329Labels.push({
                            type: 'output',
                            ref: `${txid}:${vout}`, // Output reference is 'txid:vout'
                            label: outputs[vout],
                            spendable: allSpendable, // Right now Trezor Suite does not allow to set sependable so all are `true`.
                        });
                    }
                }
            }
        }
    }

    // `addressLabels` -> mapped to BIP-329 'addr' type
    if (inputData.addressLabels) {
        for (const address in inputData.addressLabels) {
            if (Object.prototype.hasOwnProperty.call(inputData.addressLabels, address)) {
                bip329Labels.push({
                    type: 'addr',
                    ref: address,
                    label: inputData.addressLabels[address],
                });
            }
        }
    }

    return bip329Labels;
};
