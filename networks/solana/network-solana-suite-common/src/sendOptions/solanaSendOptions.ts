import type { Label, SendOptions } from '@trezor/network-module-suite-common-types';
import { SOLANA_MEMO_MAX_BYTES } from '@trezor/network-solana/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const solanaSendLabels = {
    memo: { id: 'MEMO', defaultMessage: 'Memo' },
    addMemo: { id: 'MEMO_SWITCH', defaultMessage: 'Add memo' },
    memoDescription: {
        id: 'TR_SOLANA_MEMO_TOOLTIP',
        defaultMessage: 'Add a memo to the transaction.',
    },
} as const satisfies Record<string, Label>;

/** A memo for the sender's own use, limited by the size of the memo instruction. */
export const solanaSendOptions: SendOptions = {
    memo: {
        labels: {
            name: solanaSendLabels.memo,
            add: solanaSendLabels.addMemo,
            description: solanaSendLabels.memoDescription,
        },
        identifiesRecipient: false,
        maxBytes: SOLANA_MEMO_MAX_BYTES,
        validate: () => undefined,
        getUnavailableReason: () => undefined,
    },
};
