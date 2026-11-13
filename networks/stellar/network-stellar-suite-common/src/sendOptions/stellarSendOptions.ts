import type { Label, SendOptions } from '@trezor/network-module-suite-common-types';
import { STELLAR_TEXT_MEMO_MAX_BYTES } from '@trezor/network-stellar/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const stellarSendLabels = {
    memo: { id: 'DESTINATION_TAG', defaultMessage: 'Memo/Destination tag' },
    addMemo: { id: 'DESTINATION_TAG_SWITCH', defaultMessage: 'Add Memo/Destination tag' },
    notSet: { id: 'DESTINATION_TAG_NOT_SET', defaultMessage: "Memo/Destination tag isn't set" },
    contractTokenMemo: {
        id: 'TR_STELLAR_CONTRACT_TOKEN_MEMO_UNAVAILABLE',
        defaultMessage:
            'A contract token moves in a Soroban transaction, and the network does not allow a memo on it.',
    },
} as const satisfies Record<string, Label>;

const STELLAR_CONTRACT_TOKEN_STANDARD = 'STELLAR-CONTRACT';

/**
 * Exchanges tell deposits apart by memo, so it is offered with every recipient. A contract token
 * moves in a Soroban transaction, which the network rejects with a memo.
 */
export const stellarSendOptions: SendOptions = {
    getOptions: ({ token }) => ({
        memo: {
            label: stellarSendLabels.memo,
            prominence: 'recipient',
            addLabel: stellarSendLabels.addMemo,
            maxLength: { value: STELLAR_TEXT_MEMO_MAX_BYTES, unit: 'characters' },
            requiredMessage: stellarSendLabels.notSet,
            validate: () => undefined,
            unavailable:
                token?.standard === STELLAR_CONTRACT_TOKEN_STANDARD
                    ? { reason: stellarSendLabels.contractTokenMemo }
                    : undefined,
        },
        broadcastToggle: true,
    }),
};
