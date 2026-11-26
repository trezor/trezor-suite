import { type Result, err, ok } from '@trezor/type-utils';

/** A contact name fits one line of the Trezor's output screen. */
export const MAX_CONTACT_NAME_LENGTH = 20;

const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

export type ContactNameError = 'Empty' | 'TooLong' | 'NotPlainAscii' | 'SurroundingSpace';

/**
 * The Trezor shows a WARD value as the contact's name only when it is plain text: printable ASCII
 * with no leading or trailing space (`display_text` in the firmware). Any other name would be
 * stored, but every payment to the contact would show the bare address.
 */
export const validateContactName = (name: string): Result<string, ContactNameError> => {
    if (name.length === 0) {
        return err('Empty');
    }

    if (name.length > MAX_CONTACT_NAME_LENGTH) {
        return err('TooLong');
    }

    if (!PRINTABLE_ASCII.test(name)) {
        return err('NotPlainAscii');
    }

    if (name.startsWith(' ') || name.endsWith(' ')) {
        return err('SurroundingSpace');
    }

    return ok(name);
};

/** The WARD value of a contact: the name's ASCII bytes, as hex. */
export const getContactNameValueHex = (name: string) =>
    Array.from(name, character => character.charCodeAt(0).toString(16).padStart(2, '0')).join('');
