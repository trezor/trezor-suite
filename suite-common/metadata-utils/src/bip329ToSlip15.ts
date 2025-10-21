import { Bip329Label, Slip15LikeInput } from "./types";

export const bip329ToSlip15 = (bip329Labels: Bip329Label[]): Slip15LikeInput => {
    const slip15Data: Slip15LikeInput = {
        version: '1',
        accountLabel: 'Imported BIP32 wallet',
    };

    for (const label of bip329Labels) {
        switch (label.type) {
            case 'addr':
                if (label.ref) {
                    if (!slip15Data.addressLabels) {
                        slip15Data.addressLabels = {};
                    }
                    slip15Data.addressLabels[label.ref] = label.label;
                }
                break;

            case 'output':
                if (label.ref) {
                    const parts = label.ref.split(':');
                    
                    if (parts.length === 2) {
                        const [txid, vout] = parts;

                        // Initialize outputLabels if needed
                        if (!slip15Data.outputLabels) {
                            slip15Data.outputLabels = {};
                        }
                        // Initialize the nested txid object if needed
                        if (!slip15Data.outputLabels[txid]) {
                            slip15Data.outputLabels[txid] = {};
                        }

                        slip15Data.outputLabels[txid][vout] = label.label;
                    }
                }
                break;

            default:
                break;
        }
    }

    return slip15Data;
};