import { type Branded } from '@trezor/type-utils';

// Todo: one day, we shall purify the @trezor/utils and remove domain-specific stuff from it

export type ConvertTaprootXpubParams = {
    xpub: string;
    direction: 'h-to-apostrophe' | 'apostrophe-to-h';
};

export const convertTaprootXpub = ({ xpub, direction }: ConvertTaprootXpubParams) => {
    const find = direction === 'h-to-apostrophe' ? 'h' : "'";
    const replace = direction === 'h-to-apostrophe' ? "'" : 'h';

    const openingSquareBracketSplit = xpub.split('[');
    if (openingSquareBracketSplit.length === 2) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [beforeOpeningBracket, afterOpeningBracket]: [string, string] =
            openingSquareBracketSplit;

        const closingSquareBracketSplit = afterOpeningBracket.split(']');
        if (closingSquareBracketSplit.length === 2) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [path, afterClosingBracket]: [string, string] = closingSquareBracketSplit;

            const correctedPath = path.replace(new RegExp(find, 'g'), replace); // .replaceAll()

            return `${beforeOpeningBracket}[${correctedPath}]${afterClosingBracket}`;
        }
    }

    return null;
};

/**
 * A taproot-capable account descriptor in the canonical form Suite and blockbook use
 * internally: hardened path parts are written with `'` (apostrophe), never firmware's `h`.
 * Mint one only through {@link toCanonicalDescriptor}.
 */
export type CanonicalDescriptor = string & Branded<'CanonicalDescriptor'>;

/**
 * Normalizes any descriptor to the canonical (`'`) form. Idempotent and total: descriptors
 * that are already canonical, and every non-taproot descriptor (addresses, plain xpubs), pass
 * through unchanged because {@link convertTaprootXpub} only rewrites a bracketed derivation path.
 */
export const toCanonicalDescriptor = (descriptor: string): CanonicalDescriptor =>
    (convertTaprootXpub({ xpub: descriptor, direction: 'h-to-apostrophe' }) ??
        descriptor) as CanonicalDescriptor;
