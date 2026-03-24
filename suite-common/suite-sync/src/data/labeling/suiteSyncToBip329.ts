import { type Bip329Label } from '@suite-common/bip329';
import { type SuiteSyncAddress, type SuiteSyncOutput } from '@suite-common/suite-sync-storage';

type SuiteSyncToBip329Params = {
    outputLabels: SuiteSyncOutput[];
    addressLabels: SuiteSyncAddress[];
    allSpendable: boolean;
};

export const suiteSyncToBip329 = ({
    outputLabels,
    addressLabels,
    allSpendable,
}: SuiteSyncToBip329Params): Bip329Label[] => {
    const bip329Labels: Bip329Label[] = [];

    if (outputLabels.length > 0) {
        for (const { txId, txTargetId, label } of outputLabels) {
            bip329Labels.push({
                type: 'output',
                ref: `${txId}:${txTargetId}`, // For bitcoin-like networks, txTargetId is the outputIndex (number)
                label: label ?? '',
                spendable: allSpendable, // Right now Trezor Suite does not allow to set spendable so all are `true`.
            });
        }
    }

    if (addressLabels.length > 0) {
        for (const { address, label } of addressLabels) {
            bip329Labels.push({
                type: 'addr',
                ref: address,
                label: label ?? '',
            });
        }
    }

    return bip329Labels;
};
