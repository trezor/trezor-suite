// Regular expression to match non-ASCII characters
const nonAsciiPattern = /[^\x20-\x7E]/g;

export function isAscii(value?: string): boolean {
    if (!value) return true;

    return !nonAsciiPattern.test(value);
}

export function getNonAsciiChars(value?: string): RegExpMatchArray | null {
    if (!value) return null;

    return value.match(nonAsciiPattern);
}
