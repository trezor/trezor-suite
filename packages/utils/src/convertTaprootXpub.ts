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
 * Any value accepted as a backend `descriptor` — an account descriptor, an xpub or a plain
 * address — in the canonical form Suite and blockbook use internally: where the value has hardened
 * path parts, they are written with `'` (apostrophe), never firmware's `h`. Values without a
 * derivation path are canonical as-is. Mint one only through {@link toCanonicalDescriptor}.
 */
export type CanonicalDescriptor = string & Branded<'CanonicalDescriptor'>;

/**
 * Normalizes a descriptor with a single bracketed key origin to the canonical (`'`) form.
 * Idempotent and total: already-canonical descriptors and values without a key origin (addresses,
 * plain xpubs) pass through unchanged. So do inputs {@link convertTaprootXpub} cannot parse — an
 * unclosed bracket, or more than one key origin as in a multisig descriptor — which makes the brand
 * a "this went through the normalizer" marker rather than a parse guarantee.
 */
export const toCanonicalDescriptor = (descriptor: string): CanonicalDescriptor =>
    (convertTaprootXpub({ xpub: descriptor, direction: 'h-to-apostrophe' }) ??
        descriptor) as CanonicalDescriptor;
