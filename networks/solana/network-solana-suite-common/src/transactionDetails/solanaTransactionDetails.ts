import {
    type Label,
    type TransactionDetails,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const solanaTransactionLabels = {
    memo: { id: 'MEMO', defaultMessage: 'Memo' },
} as const satisfies Record<string, Label>;

type SolanaTransaction = {
    readonly memo: string;
};

export const solanaTransactionDetails: TransactionDetails =
    defineTransactionDetails<SolanaTransaction>({
        toTransaction: ({ solanaSpecific }) =>
            solanaSpecific?.memo ? { memo: solanaSpecific.memo } : undefined,
        getFacts: ({ transaction }) => [
            {
                id: 'memo',
                label: solanaTransactionLabels.memo,
                icon: 'tag',
                value: { kind: 'text', text: transaction.memo, isUserProvided: true },
            },
        ],
    });
