export type RlpItem = Uint8Array | RlpItem[];

export type RlpDecodeResult =
    { success: true; items: RlpItem[] } | { success: false; error: string };

type Decoded = { item: RlpItem; consumed: number };

const readLength = (bytes: Uint8Array, offset: number, lengthOfLength: number): number | null => {
    if (offset + lengthOfLength > bytes.length) return null;
    let length = 0;
    for (let index = 0; index < lengthOfLength; index++) {
        length = length * 256 + bytes[offset + index]!;
    }
    // A length that only fits into more bytes than the whole input is never canonical.
    if (!Number.isSafeInteger(length)) return null;

    return length;
};

const decodeItem = (bytes: Uint8Array, offset: number): Decoded | null => {
    const prefix = bytes[offset];
    if (prefix === undefined) return null;

    if (prefix < 0x80) return { item: bytes.subarray(offset, offset + 1), consumed: 1 };

    if (prefix < 0xb8) {
        const length = prefix - 0x80;
        if (offset + 1 + length > bytes.length) return null;

        return { item: bytes.subarray(offset + 1, offset + 1 + length), consumed: 1 + length };
    }

    if (prefix < 0xc0) {
        const lengthOfLength = prefix - 0xb7;
        const length = readLength(bytes, offset + 1, lengthOfLength);
        if (length === null || offset + 1 + lengthOfLength + length > bytes.length) return null;
        const start = offset + 1 + lengthOfLength;

        return {
            item: bytes.subarray(start, start + length),
            consumed: 1 + lengthOfLength + length,
        };
    }

    const lengthOfLength = prefix < 0xf8 ? 0 : prefix - 0xf7;
    const length =
        lengthOfLength === 0 ? prefix - 0xc0 : readLength(bytes, offset + 1, lengthOfLength);
    if (length === null) return null;
    const start = offset + 1 + lengthOfLength;
    if (start + length > bytes.length) return null;

    const items: RlpItem[] = [];
    let cursor = start;
    while (cursor < start + length) {
        const child = decodeItem(bytes, cursor);
        if (child === null) return null;
        items.push(child.item);
        cursor += child.consumed;
    }
    if (cursor !== start + length) return null;

    return { item: items, consumed: 1 + lengthOfLength + length };
};

/**
 * Decodes one top-level RLP list (e.g. an execution-layer block header) and rejects trailing bytes.
 */
export const decodeRlpList = (bytes: Uint8Array): RlpDecodeResult => {
    const decoded = decodeItem(bytes, 0);
    if (decoded === null) return { success: false, error: 'malformed RLP' };
    if (decoded.consumed !== bytes.length) return { success: false, error: 'trailing bytes' };
    if (!Array.isArray(decoded.item)) return { success: false, error: 'not a list' };

    return { success: true, items: decoded.item };
};
