import { validatePassphraseEntry } from './passphrase';

describe('validatePassphraseEntry', () => {
    it('accepts an ASCII passphrase without a raw variant', () => {
        expect(
            validatePassphraseEntry({ first: 'correct horse', second: 'correct horse' }),
        ).toEqual({ success: true, payload: { normalized: 'correct horse' } });
    });

    it('accepts the empty passphrase of the standard wallet', () => {
        expect(validatePassphraseEntry({ first: '', second: '' })).toEqual({
            success: true,
            payload: { normalized: '' },
        });
    });

    it('rejects entries that differ', () => {
        expect(validatePassphraseEntry({ first: 'secret', second: 'secrot' })).toEqual({
            success: false,
            error: 'mismatch',
        });
        expect(validatePassphraseEntry({ first: 'secret', second: 'secret ' })).toEqual({
            success: false,
            error: 'mismatch',
        });
    });

    it('normalizes to NFKD and keeps the typed form as a fallback when they differ', () => {
        // A precomposed character decomposes into a base letter and a combining mark.
        const typed = 'příliš';
        const result = validatePassphraseEntry({ first: typed, second: typed });

        expect(result).toEqual({
            success: true,
            payload: { normalized: 'příliš', raw: typed },
        });
    });

    it('does not offer a raw variant when the typed form already is NFKD', () => {
        const typed = 'příliš';

        expect(validatePassphraseEntry({ first: typed, second: typed })).toEqual({
            success: true,
            payload: { normalized: typed },
        });
    });

    it('limits the passphrase to the 50 bytes the firmware can take', () => {
        expect(
            validatePassphraseEntry({ first: 'a'.repeat(50), second: 'a'.repeat(50) }).success,
        ).toBe(true);
        expect(validatePassphraseEntry({ first: 'a'.repeat(51), second: 'a'.repeat(51) })).toEqual({
            success: false,
            error: 'too-long',
        });
    });

    it('measures the limit in bytes of the normalized form, not in characters', () => {
        // 17 precomposed characters are 34 bytes typed but 51 bytes once decomposed.
        const typed = 'ř'.repeat(17);

        expect(validatePassphraseEntry({ first: typed, second: typed })).toEqual({
            success: false,
            error: 'too-long',
        });
    });
});
