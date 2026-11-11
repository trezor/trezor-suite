import {
    type Label,
    type TransactionDetails,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const stellarTransactionLabels = {
    memo: { id: 'MEMO', defaultMessage: 'Memo' },
} as const satisfies Record<string, Label>;

type StellarTransaction = {
    readonly memo: string;
};

export const stellarTransactionDetails: TransactionDetails =
    defineTransactionDetails<StellarTransaction>({
        toTransaction: ({ stellarSpecific }) =>
            stellarSpecific?.memo ? { memo: stellarSpecific.memo } : undefined,
        getFacts: ({ transaction }) => [
            {
                id: 'memo',
                label: stellarTransactionLabels.memo,
                icon: 'tag',
                value: { kind: 'text', text: transaction.memo, isUserProvided: true },
            },
        ],
    });
