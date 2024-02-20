export function isAscii(value?: string): boolean {
    if (!value) return true;

    return /^[\x00-\x7F]*$/.test(value);
}
