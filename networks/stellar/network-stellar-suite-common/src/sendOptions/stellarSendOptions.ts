import {
    type Label,
    type SendOptions,
    getUtf8ByteLength,
} from '@trezor/network-module-suite-common-types';
import { STELLAR_TEXT_MEMO_MAX_BYTES } from '@trezor/network-stellar/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const stellarSendLabels = {
    memo: { id: 'DESTINATION_TAG', defaultMessage: 'Memo/Destination tag' },
    addMemo: { id: 'DESTINATION_TAG_SWITCH', defaultMessage: 'Add Memo/Destination tag' },
    notSet: { id: 'DESTINATION_TAG_NOT_SET', defaultMessage: "Memo/Destination tag isn't set" },
    notValid: {
        id: 'DESTINATION_TAG_IS_NOT_VALID',
        defaultMessage: "Memo/Destination tag isn't valid",
    },
    contractTokenMemo: {
        id: 'TR_STELLAR_CONTRACT_TOKEN_MEMO_UNAVAILABLE',
        defaultMessage:
            'A contract token moves in a Soroban transaction, and the network does not allow a memo on it.',
    },
} as const satisfies Record<string, Label>;

const STELLAR_CONTRACT_TOKEN_STANDARD = 'STELLAR-CONTRACT';

/**
 * Exchanges tell deposits apart by memo, so a memo that is turned on can't be empty. A contract
 * token moves in a Soroban transaction, which the network rejects with a memo.
 */
export const stellarSendOptions: SendOptions = {
    memo: {
        labels: { name: stellarSendLabels.memo, add: stellarSendLabels.addMemo },
        identifiesRecipient: true,
        maxBytes: STELLAR_TEXT_MEMO_MAX_BYTES,
        validate: value => {
            if (value === '') return stellarSendLabels.notSet;

            return getUtf8ByteLength(value) > STELLAR_TEXT_MEMO_MAX_BYTES
                ? stellarSendLabels.notValid
                : undefined;
        },
        getUnavailableReason: ({ token }) =>
            token?.standard === STELLAR_CONTRACT_TOKEN_STANDARD
                ? stellarSendLabels.contractTokenMemo
                : undefined,
    },
    deferredBroadcast: true,
};
