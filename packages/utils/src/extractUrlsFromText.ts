// Bare domains take any Unicode letter, as scam tokens spell them in lookalikes, e.g.
// "ᴄʟᴀɪᴍ👉ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ". `\b` only knows ASCII, hence the lookahead after the domain.
const URL_REGEX =
    /\b(?:https?:\/\/|www\.)[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]+\b|(?:[\p{L}\p{N}-]+\s?\.\s?)+\p{L}{2,}(?![\p{L}\p{N}_])/giu;

export const extractUrlsFromText = (text: string) => {
    const urls: string[] = [];
    const textParts: string[] = [];
    let lastIndex = 0;

    const matches = [...text.matchAll(URL_REGEX)];

    matches.forEach(match => {
        const url = match[0];
        const index = match.index !== undefined ? match.index : -1; // Ensure index is defined

        // Capture text before the URL
        if (lastIndex < index) {
            textParts.push(text.slice(lastIndex, index));
        }
        // Capture the URL itself
        urls.push(url);
        lastIndex = index + url.length;
    });

    // Capture any remaining text after the last URL
    if (lastIndex < text.length) {
        textParts.push(text.slice(lastIndex));
    }

    // Special case: if there's no text before or after, ensure the array is non-empty
    if (textParts.length === 0 && urls.length > 0) {
        textParts.push('');
    }

    return { textParts, urls };
};
