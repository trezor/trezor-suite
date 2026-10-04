import { type Result, err, ok } from '@trezor/type-utils';

/** The firmware stores the passphrase in a 51-byte buffer including the terminator. */
export const MAX_PASSPHRASE_BYTES = 50;

export type PassphraseCandidates = {
    /** NFKD-normalized passphrase. This is what every current Trezor client sends. */
    normalized: string;
    /**
     * The passphrase exactly as typed, present only when normalization changes it. Old clients
     * running in browsers without `String.prototype.normalize` sent this form, so a wallet that
     * looks empty under the normalized passphrase may live under the raw one.
     */
    raw?: string;
};

export type PassphraseEntryError = 'mismatch' | 'too-long';

const getByteLength = (text: string) => new TextEncoder().encode(text).length;

export type ValidatePassphraseEntryParams = {
    first: string;
    second: string;
};

/**
 * The firmware in scope never shows the passphrase on its display, so a typo would silently
 * open a different, empty wallet. The passphrase is therefore typed twice and compared.
 */
export const validatePassphraseEntry = ({
    first,
    second,
}: ValidatePassphraseEntryParams): Result<PassphraseCandidates, PassphraseEntryError> => {
    if (first !== second) return err('mismatch');

    const normalized = first.normalize('NFKD');
    const isTooLong = [first, normalized].some(text => getByteLength(text) > MAX_PASSPHRASE_BYTES);
    if (isTooLong) return err('too-long');

    return ok(normalized === first ? { normalized } : { normalized, raw: first });
};
