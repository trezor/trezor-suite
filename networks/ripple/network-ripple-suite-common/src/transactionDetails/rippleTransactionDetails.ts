import {
    type Label,
    type TransactionDetails,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const rippleTransactionLabels = {
    destinationTag: { id: 'DESTINATION_TAG_SHORT', defaultMessage: 'Memo/Destination tag' },
} as const satisfies Record<string, Label>;

type RippleTransaction = {
    readonly destinationTag?: number;
};

export const rippleTransactionDetails: TransactionDetails =
    defineTransactionDetails<RippleTransaction>({
        toTransaction: ({ rippleSpecific }) =>
            rippleSpecific && { destinationTag: rippleSpecific.destinationTag },
        // An exchange deposit without its tag is lost, so its absence is shown as well.
        getFacts: ({ transaction }) => [
            {
                id: 'destinationTag',
                label: rippleTransactionLabels.destinationTag,
                icon: 'tag',
                value: { kind: 'text', text: transaction.destinationTag?.toString() ?? '-' },
            },
        ],
    });
