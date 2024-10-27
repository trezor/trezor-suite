// Regular expression to match non-ASCII characters
const nonAsciiPattern = /[^\x00-\x7F]/g;

export function isAscii(value?: string): boolean {
    if (!value) return true;

    return !nonAsciiPattern.test(value);
}

export function getNonAsciiChars(value?: string): RegExpMatchArray | null {
    if (!value) return null;

    return value.match(nonAsciiPattern);
}
