import type { Label, SendOptions } from '@trezor/network-module-suite-common-types';
import { TRON_DATA_MAX_BYTES, TRON_NOTE_MAX_BYTES } from '@trezor/network-tron/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const tronSendLabels = {
    note: { id: 'TR_TRON_NOTE', defaultMessage: 'Note' },
    addNote: { id: 'TR_TRON_NOTE_ADD', defaultMessage: 'Add note' },
    noteTooltip: {
        id: 'TR_TRON_NOTE_ADD_TOOLTIP',
        defaultMessage: 'Add a note to the transaction.',
    },
    noteCost: {
        id: 'TR_TRON_NOTE_INFO',
        defaultMessage: 'Adds 1 {networkDisplaySymbol} to the network fee.',
    },
    noteTooLong: { id: 'TR_TRON_NOTE_TOO_LONG', defaultMessage: 'The note is too long' },
} as const satisfies Record<string, Label>;

/** A note the sender adds on request, which costs extra, and call data for TRX transfers only. */
export const tronSendOptions: SendOptions = {
    getOptions: ({ token }) => ({
        memo: {
            label: tronSendLabels.note,
            prominence: 'optional',
            addLabel: tronSendLabels.addNote,
            tooltip: tronSendLabels.noteTooltip,
            note: tronSendLabels.noteCost,
            maxLength: { value: TRON_NOTE_MAX_BYTES, unit: 'bytes' },
            tooLongMessage: tronSendLabels.noteTooLong,
            validate: () => undefined,
        },
        data: {
            maxBytes: TRON_DATA_MAX_BYTES,
            unavailable: token ? {} : undefined,
        },
    }),
};
