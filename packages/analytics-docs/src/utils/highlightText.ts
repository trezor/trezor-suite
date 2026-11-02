export type HighlightPart = {
    text: string;
    isMatch: boolean;
    key: string;
};

const getQueryTokens = (query: string): string[] => [
    ...new Set(
        query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(token => token.length > 0),
    ),
];

export const getHighlightParts = (text: string, query: string): HighlightPart[] => {
    const tokens = getQueryTokens(query);
    if (tokens.length === 0 || text.length === 0) {
        return [{ text, isMatch: false, key: '0-0' }];
    }

    const lowerText = text.toLowerCase();
    const ranges: { start: number; end: number }[] = [];

    for (const token of tokens) {
        let fromIndex = 0;

        while (fromIndex < lowerText.length) {
            const matchIndex = lowerText.indexOf(token, fromIndex);
            if (matchIndex === -1) break;

            ranges.push({ start: matchIndex, end: matchIndex + token.length });
            fromIndex = matchIndex + token.length;
        }
    }

    const accepted: { start: number; end: number }[] = [];
    let occupiedUntil = 0;

    for (const range of ranges.toSorted((a, b) => a.start - b.start || b.end - a.end)) {
        if (range.start < occupiedUntil) continue;

        accepted.push(range);
        occupiedUntil = range.end;
    }

    if (accepted.length === 0) {
        return [{ text, isMatch: false, key: '0-0' }];
    }

    const parts: HighlightPart[] = [];
    let cursor = 0;

    for (const range of accepted) {
        if (range.start > cursor) {
            parts.push({
                text: text.slice(cursor, range.start),
                isMatch: false,
                key: `${cursor}-${range.start}`,
            });
        }

        parts.push({
            text: text.slice(range.start, range.end),
            isMatch: true,
            key: `${range.start}-${range.end}`,
        });
        cursor = range.end;
    }

    if (cursor < text.length) {
        parts.push({
            text: text.slice(cursor),
            isMatch: false,
            key: `${cursor}-${text.length}`,
        });
    }

    return parts;
};
