// Bare domains take any Unicode letter, as scam tokens spell them in lookalikes, e.g.
// "ᴄʟᴀɪᴍ👉ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ". `\b` only knows ASCII, hence the lookahead after the domain.
const PREFIXED_URL_PATTERN = String.raw`\b(?:https?:\/\/|www\.)[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]+\b`;
const BARE_URL_PATTERN = String.raw`(?:[\p{L}\p{N}-]+\s?\.\s?)+\p{L}{2,}(?![\p{L}\p{N}_])(?:[/?#][^\s()[\]<>"']*(?<![.,;:!?]))?`;

// Retry only at the start of a domain, including when dots have surrounding spaces.
const DOMAIN_START_PATTERN = String.raw`(?<![\p{L}\p{N}-]|[\p{L}\p{N}-]\s?\.\s?)`;
const URL_REGEX = new RegExp(
    `${PREFIXED_URL_PATTERN}|${DOMAIN_START_PATTERN}${BARE_URL_PATTERN}`,
    'giu',
);
// Sticky matching cannot retry at every position inside a failed domain.
const URL_AT_INDEX_REGEX = new RegExp(`${PREFIXED_URL_PATTERN}|${BARE_URL_PATTERN}`, 'iyu');
// The domain guard can inspect a Unicode code point (two UTF-16 units), two spaces and a dot.
const DOMAIN_BOUNDARY_LENGTH = 5;

export const extractUrlsFromText = (text: string) => {
    const urls: string[] = [];
    const textParts: string[] = [];
    let lastIndex = 0;

    while (lastIndex < text.length) {
        let match: RegExpExecArray | null = null;
        const boundaryEnd = Math.min(lastIndex + DOMAIN_BOUNDARY_LENGTH, text.length);

        // Preserve adjacent URLs when the guard would look into the previous match.
        for (let index = lastIndex; index < boundaryEnd; index++) {
            URL_AT_INDEX_REGEX.lastIndex = index;
            match = URL_AT_INDEX_REGEX.exec(text);
            if (match) {
                break;
            }
        }

        if (!match) {
            URL_REGEX.lastIndex = boundaryEnd;
            match = URL_REGEX.exec(text);
        }

        if (!match) {
            break;
        }

        const url = match[0];
        const { index } = match;

        // Capture text before the URL
        textParts.push(text.slice(lastIndex, index));
        // Capture the URL itself
        urls.push(url);
        lastIndex = index + url.length;
    }

    // Capture any remaining text after the last URL
    if (lastIndex < text.length) {
        textParts.push(text.slice(lastIndex));
    }

    return { textParts, urls };
};
