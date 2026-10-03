import { avatarHue, avatarInitials } from './avatar';

describe('contacts avatar', () => {
    describe('avatarHue', () => {
        it('is deterministic and stays within 0–359', () => {
            const npub = 'npub1abcdefghijklmnopqrstuvwxyz';
            const hue = avatarHue(npub);
            expect(hue).toBe(avatarHue(npub));
            expect(hue).toBeGreaterThanOrEqual(0);
            expect(hue).toBeLessThan(360);
        });

        it('yields different hues for different seeds', () => {
            expect(avatarHue('npub1aaa')).not.toBe(avatarHue('npub1bbb'));
        });
    });

    describe('avatarInitials', () => {
        it('takes the first letter of the first two words', () => {
            expect(avatarInitials('Satoshi Nakamoto')).toBe('SN');
            expect(avatarInitials('  alice   bob  ')).toBe('AB');
        });

        it('takes the first two characters of a single word', () => {
            expect(avatarInitials('Alice')).toBe('AL');
            expect(avatarInitials('a')).toBe('A');
        });

        it('returns an empty string for an empty or whitespace-only label', () => {
            expect(avatarInitials('')).toBe('');
            expect(avatarInitials('   ')).toBe('');
        });

        it('keeps astral-plane characters whole instead of splitting a surrogate pair', () => {
            // An emoji is one code point but two UTF-16 code units; indexing code units would emit
            // a lone half of a surrogate pair. A single word takes its first two code points.
            expect(avatarInitials('😀🎉')).toBe('😀🎉');
            // Two words take the first code point of each.
            expect(avatarInitials('😀 🎉party')).toBe('😀🎉');
        });

        it('uppercases multibyte letters without dropping them', () => {
            expect(avatarInitials('ćma')).toBe('ĆM');
            expect(avatarInitials('ža ba')).toBe('ŽB');
        });
    });
});
