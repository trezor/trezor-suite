import { decodeRlpList } from './rlp';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('decodeRlpList', () => {
    it('decodes short strings, empty strings and single bytes', () => {
        const result = decodeRlpList(bytes(0xc5, 0x01, 0x80, 0x82, 0xab, 0xcd));

        expect(result).toEqual({
            success: true,
            items: [bytes(0x01), bytes(), bytes(0xab, 0xcd)],
        });
    });

    it('decodes nested lists', () => {
        expect(decodeRlpList(bytes(0xc2, 0xc1, 0x01))).toEqual({
            success: true,
            items: [[bytes(0x01)]],
        });
    });

    it('decodes long lists and long strings', () => {
        const longString = new Array(56).fill(0x11);
        const payload = [0xb8, 56, ...longString, 0x01];
        const result = decodeRlpList(bytes(0xf8, payload.length, ...payload));

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toEqual(bytes(...longString));
        expect(result.items[1]).toEqual(bytes(0x01));
    });

    it('rejects a non-list, trailing bytes and truncated input', () => {
        expect(decodeRlpList(bytes(0x01))).toEqual({ success: false, error: 'not a list' });
        expect(decodeRlpList(bytes(0xc1, 0x01, 0x02))).toEqual({
            success: false,
            error: 'trailing bytes',
        });
        expect(decodeRlpList(bytes(0xc3, 0x01))).toEqual({
            success: false,
            error: 'malformed RLP',
        });
        expect(decodeRlpList(bytes())).toEqual({ success: false, error: 'malformed RLP' });
    });
});
