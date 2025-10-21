import { Bip329Label, Slip15LikeInput } from "./types";

// Transforms a custom SLIP-15 like wallet label object into an array of BIP-329 label objects.
export const transformToBip329 = (inputData: Slip15LikeInput): Bip329Label[] => {
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
                            ref: `${txid}:${vout}`, // output reference is 'txid:vout'
                            label: outputs[vout],
                            spendable: true, // right now Trezor Suite does not allow to set sependable so all are `true`.
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
                    ref: address, // Address reference is the address itself
                    label: inputData.addressLabels[address],
                });
            }
        }
    }

    return bip329Labels;
};
