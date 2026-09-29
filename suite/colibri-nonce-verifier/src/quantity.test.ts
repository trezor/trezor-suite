import {
    bytesToBigint,
    bytesToHex,
    hexToBytes,
    parseHexQuantity,
    toDecimalString,
} from './quantity';

describe('parseHexQuantity', () => {
    it('parses canonical and zero-padded quantities exactly', () => {
        expect(parseHexQuantity('0x4b9f3')).toEqual({ success: true, value: 309747n });
        expect(parseHexQuantity('0x0')).toEqual({ success: true, value: 0n });
        expect(parseHexQuantity('0x00ff')).toEqual({ success: true, value: 255n });
    });

    it('keeps values above Number.MAX_SAFE_INTEGER exact', () => {
        const result = parseHexQuantity('0x20000000000001');

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(toDecimalString(result.value)).toBe('9007199254740993');
        // The same value rounds through a JS number, which is exactly what the string path avoids.
        expect(String(Number('0x20000000000001'))).toBe('9007199254740992');
    });

    it('rejects anything that is not a hex quantity', () => {
        expect(parseHexQuantity('4b9f3').success).toBe(false);
        expect(parseHexQuantity('0x').success).toBe(false);
        expect(parseHexQuantity('0xzz').success).toBe(false);
        expect(parseHexQuantity(42).success).toBe(false);
        expect(parseHexQuantity(undefined).success).toBe(false);
        expect(parseHexQuantity(`0x${'f'.repeat(65)}`).success).toBe(false);
    });
});

describe('byte helpers', () => {
    it('converts big-endian bytes to bigint', () => {
        expect(bytesToBigint(new Uint8Array([]))).toBe(0n);
        expect(bytesToBigint(new Uint8Array([0x01, 0x00]))).toBe(256n);
        expect(bytesToBigint(new Uint8Array([0x01, 0x02, 0x03, 0x04]))).toBe(16909060n);
    });

    it('round-trips hex and rejects malformed hex', () => {
        expect(hexToBytes('0x00ff')).toEqual(new Uint8Array([0, 255]));
        expect(hexToBytes('0x')).toEqual(new Uint8Array([]));
        expect(hexToBytes('0xabc')).toBeNull();
        expect(hexToBytes('00ff')).toBeNull();
        expect(hexToBytes(1)).toBeNull();
        expect(bytesToHex(new Uint8Array([0, 255, 16]))).toBe('0x00ff10');
    });
});
