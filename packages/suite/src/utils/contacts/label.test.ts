import { MAX_LABEL_BYTES, isLabelWithinLimit, labelByteLength } from './label';

describe('contacts label', () => {
    describe('labelByteLength', () => {
        it('counts ASCII as one byte per character', () => {
            expect(labelByteLength('Satoshi')).toBe(7);
            expect(labelByteLength('')).toBe(0);
        });

        it('counts multibyte characters by their UTF-8 byte length, not character count', () => {
            // 'č' is 2 bytes and '😀' is 4, so a short-looking name can still exceed the cap.
            expect(labelByteLength('č')).toBe(2);
            expect(labelByteLength('😀')).toBe(4);
        });
    });

    describe('isLabelWithinLimit', () => {
        it('rejects an empty or whitespace-only label', () => {
            expect(isLabelWithinLimit('')).toBe(false);
            expect(isLabelWithinLimit('   ')).toBe(false);
        });

        it('accepts a label exactly at the byte cap and rejects one byte over', () => {
            expect(isLabelWithinLimit('a'.repeat(MAX_LABEL_BYTES))).toBe(true);
            expect(isLabelWithinLimit('a'.repeat(MAX_LABEL_BYTES + 1))).toBe(false);
        });

        it('measures the trimmed value, so surrounding whitespace does not count against the cap', () => {
            expect(isLabelWithinLimit(`  ${'a'.repeat(MAX_LABEL_BYTES)}  `)).toBe(true);
        });

        it('counts multibyte characters by bytes, so 16 two-byte chars fill the 32-byte cap', () => {
            expect(isLabelWithinLimit('č'.repeat(16))).toBe(true);
            expect(isLabelWithinLimit('č'.repeat(17))).toBe(false);
        });
    });
});
