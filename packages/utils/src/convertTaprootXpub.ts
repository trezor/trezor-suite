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
        const beforeOpeningBracket = openingSquareBracketSplit[0] ?? '';
        const afterOpeningBracket = openingSquareBracketSplit[1] ?? '';

        const closingSquareBracketSplit = afterOpeningBracket.split(']');
        if (closingSquareBracketSplit.length === 2) {
            const path = closingSquareBracketSplit[0] ?? '';
            const afterClosingBracket = closingSquareBracketSplit[1] ?? '';

            const correctedPath = path.replace(new RegExp(find, 'g'), replace); // .replaceAll()

            return `${beforeOpeningBracket}[${correctedPath}]${afterClosingBracket}`;
        }
    }

    return null;
};
