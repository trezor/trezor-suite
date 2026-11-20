export const MAX_NAME_LENGTH = 100;

// Joiners and emoji variation selectors are kept because Persian, Indic and emoji names need them.
const INVISIBLE_CHARACTERS =
    /(?!\u200c|\u200d|\ufe0e|\ufe0f)[\p{Cf}\p{Default_Ignorable_Code_Point}\u2800]/gu;

// More than four stacked marks would paint over the text around the name.
const EXCESS_COMBINING_MARKS = /(\p{M}{4})\p{M}+/gu;

const VISIBLE_CHARACTER = /[\p{L}\p{N}\p{P}\p{S}]/u;

const keepVisibleName = (name: string) => (VISIBLE_CHARACTER.test(name) ? name : undefined);

/**
 * Makes a caller-picked name safe to display, cut to `MAX_NAME_LENGTH` code points. Returns
 * `undefined` when nothing visible is left. It does not establish who the caller is.
 */
export const sanitizeName = (name: unknown): string | undefined => {
    if (typeof name !== 'string') return undefined;

    const sanitized = name
        .replace(INVISIBLE_CHARACTERS, '')
        .replace(/[\p{Cc}\p{Cs}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(EXCESS_COMBINING_MARKS, '$1');

    return keepVisibleName(Array.from(sanitized).slice(0, MAX_NAME_LENGTH).join('').trim());
};
