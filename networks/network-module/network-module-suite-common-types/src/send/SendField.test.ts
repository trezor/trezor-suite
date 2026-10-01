import { type SendFieldDeclaration, validateSendField } from './SendField';

describe('validateSendField', () => {
    const memo: SendFieldDeclaration = { id: 'memo', kind: 'text', limit: { bytes: 4 } };
    const tag: SendFieldDeclaration = { id: 'tag', kind: 'uint32' };

    it('accepts an empty value for any field', () => {
        expect(validateSendField(memo, '')).toBeUndefined();
        expect(validateSendField(tag, '')).toBeUndefined();
    });

    it('counts text limits in bytes, not characters', () => {
        expect(validateSendField(memo, 'abcd')).toBeUndefined();
        expect(validateSendField(memo, 'abcde')).toBe('too-long');
        // Two characters, six bytes.
        expect(validateSendField(memo, ' čš')).toBe('too-long');
    });

    it('accepts text without a limit', () => {
        expect(validateSendField({ id: 'note', kind: 'text' }, 'x'.repeat(1000))).toBeUndefined();
    });

    it('requires uint32 values to be decimal digits in range', () => {
        expect(validateSendField(tag, '0')).toBeUndefined();
        expect(validateSendField(tag, '4294967295')).toBeUndefined();
        expect(validateSendField(tag, '4294967296')).toBe('out-of-range');
        expect(validateSendField(tag, '-1')).toBe('not-a-number');
        expect(validateSendField(tag, '1.5')).toBe('not-a-number');
        expect(validateSendField(tag, 'abc')).toBe('not-a-number');
    });
});
