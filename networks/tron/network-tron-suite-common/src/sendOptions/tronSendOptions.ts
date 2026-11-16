import {
    type Label,
    type SendOptions,
    getUtf8ByteLength,
} from '@trezor/network-module-suite-common-types';
import { TRON_DATA_MAX_BYTES, TRON_NOTE_MAX_BYTES } from '@trezor/network-tron/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const tronSendLabels = {
    note: { id: 'TR_TRON_NOTE', defaultMessage: 'Note' },
    addNote: { id: 'TR_TRON_NOTE_ADD', defaultMessage: 'Add note' },
    noteDescription: {
        id: 'TR_TRON_NOTE_ADD_TOOLTIP',
        defaultMessage: 'Add a note to the transaction.',
    },
    noteCost: {
        id: 'TR_TRON_NOTE_INFO',
        defaultMessage: 'Adds 1 {networkDisplaySymbol} to the network fee.',
    },
    noteTooLong: { id: 'TR_TRON_NOTE_TOO_LONG', defaultMessage: 'The note is too long' },
} as const satisfies Record<string, Label>;

/** A note for the sender's own use, which costs extra, and call data for TRX transfers only. */
export const tronSendOptions: SendOptions = {
    memo: {
        labels: {
            name: tronSendLabels.note,
            add: tronSendLabels.addNote,
            description: tronSendLabels.noteDescription,
            notice: tronSendLabels.noteCost,
        },
        identifiesRecipient: false,
        maxBytes: TRON_NOTE_MAX_BYTES,
        validate: value =>
            getUtf8ByteLength(value) > TRON_NOTE_MAX_BYTES ? tronSendLabels.noteTooLong : undefined,
        getUnavailableReason: () => undefined,
    },
    data: { maxBytes: TRON_DATA_MAX_BYTES, isAllowed: ({ token }) => token === undefined },
};
