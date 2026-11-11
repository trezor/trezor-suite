import {
    type Label,
    type TransactionDetails,
    type TransactionFact,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const tronTransactionLabels = {
    energy: { id: 'TR_TRON_ENERGY', defaultMessage: 'Energy' },
    bandwidth: { id: 'TR_TRON_BANDWIDTH', defaultMessage: 'Bandwidth' },
    note: { id: 'TR_TRON_NOTE', defaultMessage: 'Note' },
} as const satisfies Record<string, Label>;

/** Tron pays with resources rather than a fee rate, and each is optional. */
type TronTransaction = {
    readonly energyUsage?: string;
    readonly bandwidthUsage?: string;
    readonly note?: string;
};

export const tronTransactionDetails: TransactionDetails = defineTransactionDetails<TronTransaction>(
    {
        toTransaction: ({ tronSpecific }) =>
            tronSpecific && {
                energyUsage: tronSpecific.energyUsage,
                bandwidthUsage: tronSpecific.bandwidthUsage,
                note: tronSpecific.note,
            },
        getFacts: ({ transaction }) => {
            const facts: TransactionFact[] = [];

            if (transaction.energyUsage) {
                facts.push({
                    id: 'energy',
                    label: tronTransactionLabels.energy,
                    icon: 'gas',
                    value: { kind: 'text', text: transaction.energyUsage },
                });
            }

            if (transaction.bandwidthUsage) {
                facts.push({
                    id: 'bandwidth',
                    label: tronTransactionLabels.bandwidth,
                    icon: 'gas',
                    value: { kind: 'text', text: transaction.bandwidthUsage },
                });
            }

            if (transaction.note) {
                facts.push({
                    id: 'note',
                    label: tronTransactionLabels.note,
                    icon: 'note',
                    value: { kind: 'text', text: transaction.note, isUserProvided: true },
                });
            }

            return facts;
        },
    },
);
