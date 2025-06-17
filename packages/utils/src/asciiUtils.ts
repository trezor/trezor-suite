const ASCII_RANGE = '[^\x20-\x7E]';

const nonAsciiPattern = new RegExp(ASCII_RANGE);
const nonAsciiPatternGlobal = new RegExp(ASCII_RANGE, 'g');

export function isAscii(value?: string): boolean {
    if (!value) return true;

    return !nonAsciiPattern.test(value);
}

export function getNonAsciiChars(value?: string): RegExpMatchArray | null {
    if (!value) return null;

    return value.match(nonAsciiPatternGlobal);
}
