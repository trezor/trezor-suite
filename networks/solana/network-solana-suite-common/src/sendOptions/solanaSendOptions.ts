import type { Label, SendOptions } from '@trezor/network-module-suite-common-types';
import { SOLANA_MEMO_MAX_BYTES } from '@trezor/network-solana/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const solanaSendLabels = {
    memo: { id: 'MEMO', defaultMessage: 'Memo' },
    addMemo: { id: 'MEMO_SWITCH', defaultMessage: 'Add memo' },
    memoTooltip: { id: 'TR_SOLANA_MEMO_TOOLTIP', defaultMessage: 'Add a memo to the transaction.' },
} as const satisfies Record<string, Label>;

/** A memo the sender adds on request, limited by the size of the memo instruction. */
export const solanaSendOptions: SendOptions = {
    getOptions: () => ({
        memo: {
            label: solanaSendLabels.memo,
            prominence: 'optional',
            addLabel: solanaSendLabels.addMemo,
            tooltip: solanaSendLabels.memoTooltip,
            maxLength: { value: SOLANA_MEMO_MAX_BYTES, unit: 'bytes' },
            validate: () => undefined,
        },
    }),
};
